'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ArrowDownToLine, ArrowUpLeft, Eye, LayoutTemplate, Plus, Printer, Save, Search, Trash2, X } from 'lucide-react';
import { catalogueService } from '@/services/catalogueService';
import { useTranslation } from '@/context';
import type { CatalogueDesign } from '@/features/catalogue';
import styles from './builder.module.css';

type Section = 'story' | 'index' | 'subIndex' | 'design' | 'divider' | 'technical';

const openingPages = Array.from({ length: 10 }, (_, index) =>
  `/catalogue-themes/endless-2026/opening-${String(index + 1).padStart(2, '0')}.jpg`,
);
const marvelStoryPages = Array.from({ length: 7 }, (_, index) =>
  `/catalogue-themes/flais-book/intro-${String(index + 1).padStart(2, '0')}.jpg`,
);
const technicalPages = Array.from({ length: 5 }, (_, index) =>
  `/catalogue-themes/endless-2026/technical-${String(index + 1).padStart(2, '0')}.${index === 4 ? 'png' : 'jpg'}`,
);

const storyTemplates = [
  {
    id: 'endless-2026',
    src: openingPages[0],
    label: 'endlessStoryName',
    count: openingPages.length,
    pages: openingPages,
  },
  {
    id: 'marvel-v17',
    src: marvelStoryPages[0],
    label: 'marvelStoryName',
    count: marvelStoryPages.length,
    pages: marvelStoryPages,
  },
];

const layouts: Record<Section, string[]> = {
  story: storyTemplates.map((template) => template.id),
  index: ['selected-designs'],
  subIndex: [],
  design: [],
  divider: [],
  technical: ['endless-technical'],
};

const sectionKeys: Record<Section, string> = {
  story: 'storySection',
  index: 'indexSection',
  subIndex: 'subIndexSection',
  design: 'designSection',
  divider: 'dividerSection',
  technical: 'technicalSection',
};

const indexPageCapacity = 42;

export function CatalogueBuilder() {
  const router = useRouter();
  const { t } = useTranslation();
  const [products, setProducts] = useState<CatalogueDesign[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [client, setClient] = useState('');
  const [publicCatalogue, setPublicCatalogue] = useState(false);
  const [logo, setLogo] = useState(true);
  const [dividers, setDividers] = useState(true);
  const [unit, setUnit] = useState('mm');
  const quality = 'Print quality';
  const [preview, setPreview] = useState(false);
  const [viewerOnly, setViewerOnly] = useState(false);
  const [printPending, setPrintPending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [printRoot, setPrintRoot] = useState<HTMLElement | null>(null);
  const [chosen, setChosen] = useState<Record<Section, string>>({
    story: 'endless-2026',
    index: '',
    subIndex: '',
    design: '',
    divider: '',
    technical: 'endless-technical',
  });
  const [includeIndex, setIncludeIndex] = useState(true);
  const [includeTechnical, setIncludeTechnical] = useState(true);

  useEffect(() => {
    let root = document.getElementById('catalogue-print-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'catalogue-print-root';
      document.body.appendChild(root);
    }
    setPrintRoot(root);
    return () => root?.remove();
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('preview') === '1') {
      setViewerOnly(true);
      setPreview(true);
    }
  }, []);

  useEffect(() => {
    let live = true;
    catalogueService
      .list()
      .then((items) => {
        if (live) setProducts(items.filter((product) => !product.deletedAt));
      })
      .catch(() => {
        if (live) setNotice('Could not load designs. Please check your connection and try again.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    try {
      const saved = JSON.parse(localStorage.getItem('tile-catalogue-builder-v1') || 'null');
      if (saved) {
        setName(saved.name || '');
        setRemarks(saved.remarks || '');
        setSelected(saved.selected || []);
        setChosen((current) => ({
          ...current,
          ...saved.chosen,
          story: saved.chosen?.story ?? current.story,
          technical: saved.chosen?.technical ?? current.technical,
        }));
        setIncludeIndex(
          typeof saved.includeIndex === 'boolean'
            ? saved.includeIndex
            : Array.isArray(saved.selectedIndexPages)
              ? saved.selectedIndexPages.length > 0
              : true,
        );
        setIncludeTechnical(saved.includeTechnical !== false);
        setClient(saved.client || '');
        setPublicCatalogue(!!saved.publicCatalogue);
        setLogo(saved.logo !== false);
        setDividers(saved.dividers !== false);
        setUnit(saved.unit || 'mm');
      }
    } catch {
      // Ignore malformed local drafts and start with the default catalogue order.
    }

    return () => {
      live = false;
    };
  }, []);

  const visible = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.collection} ${product.size}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, query],
  );

  const selectedProducts = products.filter((product) => selected.includes(product.id));
  const activeStory = storyTemplates.find((template) => template.id === chosen.story);
  const activeStoryPages = activeStory?.pages ?? [];
  const indexPageCount = includeIndex ? Math.ceil(selectedProducts.length / indexPageCapacity) : 0;
  const indexPages = Array.from({ length: indexPageCount }, (_, index) => ({
    page: index,
    products: selectedProducts.slice(index * indexPageCapacity, (index + 1) * indexPageCapacity),
  }));
  const productPageNumbers = useMemo(() => {
    let page = activeStoryPages.length + indexPageCount + 1;
    return Object.fromEntries(selectedProducts.map((product) => {
      const tilePage = page++;
      const previewPages = product.media
        .filter((media) => media.role === 'preview')
        .map(() => page++);
      return [product.id, { tilePage, previewPages }];
    }));
  }, [activeStoryPages.length, indexPageCount, selectedProducts]);
  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const draftConfig = {
    name,
    remarks,
    selected,
    chosen,
    includeIndex,
    includeTechnical,
    client,
    publicCatalogue,
    logo,
    dividers,
    unit,
    quality,
  };

  const save = () => {
    try {
      localStorage.setItem('tile-catalogue-builder-v1', JSON.stringify(draftConfig));
      setNotice('Catalogue draft saved on this device.');
    } catch {
      setNotice('Unable to save this draft in the browser.');
    }
  };

  const print = async () => {
    if (!selectedProducts.length) {
      setNotice('No designs are selected. Select at least one design in the Product list, then create the PDF.');
      return;
    }
    if (isCreating) return;
    setIsCreating(true);
    setNotice('Saving this PDF to Catalogue History…');
    let entry;
    try {
      entry = await catalogueService.createHistory({
        name: name.trim() || 'Untitled catalogue',
        assignedTo: client || '',
        config: draftConfig,
      });
    } catch {
      setNotice('Could not save this PDF to Catalogue History. Check your connection and sign-in, then try again.');
      setIsCreating(false);
      return;
    }
    await catalogueService.updateHistoryStatus(entry.id, 'READY').catch(() => undefined);
    setIsCreating(false);
    setNotice('Catalogue saved to History. Review the preview, then choose Download PDF.');
    setViewerOnly(true);
    setPreview(true);
  };

  useEffect(() => {
    if (!preview || !printPending) return;
    let cancelled = false;
    const prepare = async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      try {
        await document.fonts.ready;
      } catch {
        // Printing can proceed with the browser fallback font.
      }
      const deadline = Date.now() + 45000;
      while (printRoot?.querySelectorAll('[data-print-image="pending"]').length && Date.now() < deadline) {
        await new Promise((resolve) => window.setTimeout(resolve, 100));
      }
      if (cancelled || !printRoot) return;

      const images = Array.from(printRoot.querySelectorAll<HTMLImageElement>('img'));
      await Promise.all(
        images.map(async (image) => {
          const imageDeadline = Date.now() + 45000;
          while ((!image.complete || image.naturalWidth === 0) && Date.now() < imageDeadline) {
            await new Promise((resolve) => window.setTimeout(resolve, 100));
          }
          try {
            await image.decode();
          } catch {
            // ProductImage renders its own fallback when an uploaded file is unavailable.
          }
        }),
      );
      if (!cancelled) {
        // Let the browser lay out the fully decoded pages before opening print preview.
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        if (cancelled) return;
        setPrintPending(false);
        window.print();
      }
    };
    void prepare();
    return () => {
      cancelled = true;
    };
  }, [preview, printPending]);

  const renderLayoutCard = (section: Section, layout: string) => {
    const isStory = section === 'story';
    const isIndex = section === 'index';
    const template = isStory ? storyTemplates.find((item) => item.id === layout) : undefined;
    const active = isStory
      ? chosen.story === layout
      : isIndex
        ? includeIndex
        : section === 'technical'
          ? includeTechnical
          : chosen[section] === layout;
    const label = template
      ? t(`catalogueBuilder.${template.label}`)
      : isIndex
        ? t('catalogueBuilder.selectedDesignIndexName')
        : t('catalogueBuilder.technicalTemplateName');
    const count = template?.count ?? (isIndex ? indexPageCount : technicalPages.length);
    const image = template?.src ?? (isIndex ? '/catalogue-themes/endless-2026/index-preview.jpg' : technicalPages[0]);
    return (
      <button
        type="button"
        className={`${styles.layoutCard} ${active ? styles.active : ''}`}
        key={layout}
        aria-pressed={active}
        onClick={() => {
          if (isStory) setChosen((current) => ({ ...current, story: current.story === layout ? '' : layout }));
          else if (isIndex) setIncludeIndex((current) => !current);
          else if (section === 'technical') setIncludeTechnical((current) => !current);
        }}
      >
        {isIndex ? (
          <div className={`${styles.indexTemplateThumb} ${styles.templateThumb}`} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : (
          <img
            className={`${styles.templateThumb} ${isStory ? '' : styles.indexThumb}`}
            src={image}
            alt={label}
          />
        )}
        <span className={styles.layoutCaption}>
          {label}
          <span>{t('catalogueBuilder.pageCount', { count })}</span>
        </span>
      </button>
    );
  };

  return (
    <main className={styles.builder}>
      <header className={styles.top}>
        <div>
          <span className={styles.kicker}>CATALOGUE STUDIO</span>
          <h1>Catalogue Builder</h1>
        </div>
        <div className={styles.toolbar}>
          <button aria-label="Preview catalogue" onClick={() => setPreview((value) => !value)}>
            <Eye size={17} />
            <span>Preview</span>
          </button>
          <button onClick={save}>
            <Save size={17} />
            <span>Save draft</span>
          </button>
          <button className={styles.primary} onClick={print} disabled={isCreating}>
            <Printer size={17} />
            <span>{isCreating ? 'Preparing PDF…' : 'Create PDF'}</span>
          </button>
        </div>
      </header>
      {notice && (
        <div className={styles.notice} role="status">
          {notice}
          <button onClick={() => setNotice('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      <div className={styles.settings}>
        <label className={styles.toggle}>
          <input type="checkbox" checked={publicCatalogue} onChange={(event) => setPublicCatalogue(event.target.checked)} />
          Public
        </label>
        <label className={styles.client}>
          Client
          <select value={client} onChange={(event) => setClient(event.target.value)}>
            <option value="">Select client</option>
            <option>General catalogue</option>
          </select>
        </label>
        <label className={styles.toggle}>
          <input type="checkbox" checked={logo} onChange={(event) => setLogo(event.target.checked)} />
          Logo
        </label>
        <label className={styles.toggle}>
          <input type="checkbox" checked={dividers} onChange={(event) => setDividers(event.target.checked)} />
          Divider
        </label>
        <label>
          Units
          <select value={unit} onChange={(event) => setUnit(event.target.value)}>
            <option>mm</option>
            <option>cm</option>
            <option>in</option>
          </select>
        </label>
        <span className={styles.qualityLabel}><Printer size={15} />Print quality</span>
        <span className={styles.qualityHint}>Source artwork and original product photos are retained. In the print dialog choose “Save as PDF” and 100% scale.</span>
      </div>
      <div className={`${styles.workarea} ${preview ? styles.previewMode : ''}`}>
        <section className={styles.layouts} aria-label="Page layouts">
          <div className={styles.templateNotice}>{t('catalogueBuilder.pageArtworkNotice')}</div>
          {(Object.keys(layouts) as Section[])
            .filter((section) => section !== 'divider' || dividers)
            .map((section) => (
              <section className={styles.layoutSection} key={section}>
                <header>
                  <h2>{t(`catalogueBuilder.${sectionKeys[section]}`)}</h2>
                  {section === 'index' ? (
                    <span className={styles.pendingBadge}>{t('catalogueBuilder.indexTemplateCount', { count: indexPageCount })}</span>
                  ) : section === 'technical' ? (
                    <span className={styles.pendingBadge}>
                      {includeTechnical ? t('catalogueBuilder.pageCount', { count: technicalPages.length }) : t('catalogueBuilder.excluded')}
                    </span>
                  ) : layouts[section].length ? (
                    <span className={styles.pendingBadge}>
                      {t('catalogueBuilder.storyTemplateReady', {
                        count: storyTemplates.find((template) => template.id === chosen.story)?.count ?? 0,
                      })}
                    </span>
                  ) : (
                    <span className={styles.pendingBadge}>{t('catalogueBuilder.awaitingArtwork')}</span>
                  )}
                </header>
                {layouts[section].length ? (
                  <div className={styles.layoutCards}>
                    {layouts[section].map((layout) => renderLayoutCard(section, layout))}
                  </div>
                ) : (
                  <div className={styles.templatePending}>
                    <LayoutTemplate size={18} />
                    <span>
                      {section === 'divider'
                        ? t('catalogueBuilder.templatePending', { section: t(`catalogueBuilder.${sectionKeys[section]}`).toLowerCase() })
                        : t('catalogueBuilder.templatePending', { section: t(`catalogueBuilder.${sectionKeys[section]}`).toLowerCase() })}
                    </span>
                  </div>
                )}
              </section>
            ))}
        </section>
        <aside className={styles.products}>
          <div className={styles.catalogueName}>
            <label>
              <span>Catalogue name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Add catalogue name" />
            </label>
            <label>
              <span>Remarks</span>
              <input value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Add a note" />
            </label>
          </div>
          <div className={styles.productTools}>
            <label className={styles.search}>
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search designs" aria-label="Search designs" />
            </label>
            <span>{selectedProducts.length} selected</span>
          </div>
          <div className={styles.productList}>
            {loading ? (
              <p>Loading designs…</p>
            ) : (
              visible.map((product) => {
                const photo = product.media.find((media) => media.role === 'preview') || product.media.find((media) => media.role === 'tile-face');
                return (
                  <label className={styles.product} key={product.id}>
                    <input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggle(product.id)} />
                    <span className={styles.productPhoto}>
                      {photo ? <ProductImage id={photo.id} alt={product.name} /> : <LayoutTemplate size={20} />}
                    </span>
                    <span className={styles.productInfo}>
                      <strong>{product.name}</strong>
                      <span>{product.size} · {product.collection} · {product.surface} · {product.thickness} mm</span>
                    </span>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label={`Remove ${product.name}`}
                      onClick={(event) => {
                        event.preventDefault();
                        toggle(product.id);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </label>
                );
              })
            )}
            {!loading && !visible.length && <p className={styles.empty}>No designs match your search.</p>}
          </div>
          <footer>
            <span>{selectedProducts.length} designs in catalogue</span>
            <button onClick={() => setSelected((current) => Array.from(new Set([...current, ...visible.map((product) => product.id)])))}>
              <Plus size={15} />Add visible
            </button>
          </footer>
        </aside>
      </div>
      {preview && printRoot && createPortal(
        <section className={`${styles.previewSheet} ${viewerOnly ? styles.viewerOnly : ''}`} data-quality={quality.toLowerCase()}>
          <header className={styles.previewToolbar} aria-label={t('catalogueBuilder.previewControls')}>
            <div className={styles.previewToolbarActions}>
              <button className={styles.previewDownload} onClick={() => setPrintPending(true)} disabled={printPending || loading} aria-label={t('catalogueBuilder.downloadPdf')} title={t('catalogueBuilder.downloadPdf')}>
                <ArrowDownToLine size={18} />
              </button>
              <button onClick={() => {
                if (viewerOnly) router.push('/catalogues/history');
                else setPreview(false);
              }} aria-label={t('catalogueBuilder.closePreview')} title={t('catalogueBuilder.closePreview')}><X size={18} /></button>
            </div>
          </header>
          {remarks && <p className={styles.previewRemark}>{remarks}</p>}
          {activeStoryPages.map((src, index) => (
            <section
              className={`${styles.cataloguePage} ${index === 0 ? styles.portraitPage : styles.landscapePage}`}
              key={src}
              aria-label={t('catalogueBuilder.storyPageNumber', { number: index + 1 })}
            >
              <img className={styles.fullPageArtwork} src={src} alt={t('catalogueBuilder.storyPageNumber', { number: index + 1 })} />
            </section>
          ))}
          {indexPages.map(({ page, products: pageProducts }) => (
            <section id={page === 0 ? 'catalogue-index' : undefined} className={`${styles.cataloguePage} ${styles.landscapePage} ${styles.dynamicIndexPage}`} key={`index-${page}`}>
              <header className={styles.dynamicIndexHeading}>
                <div>
                  <strong>{name || t('catalogueBuilder.indexTitle')}</strong>
                  <span>{t('catalogueBuilder.indexKicker')}</span>
                </div>
                <span>{t('catalogueBuilder.indexPageNumber', { current: page + 1, total: indexPageCount })}</span>
              </header>
              <div className={styles.dynamicIndexGrid}>
                {pageProducts.map((product) => {
                  const face = product.media.find((media) => media.role === 'tile-face');
                  return (
                    <figure className={styles.dynamicIndexItem} key={product.id}>
                      <div className={styles.dynamicIndexSwatch}>
                        {face ? <ProductImage id={face.id} alt={product.name} /> : <span>{product.name}</span>}
                      </div>
                      <figcaption>{product.name}</figcaption>
                    </figure>
                  );
                })}
              </div>
              <footer className={styles.dynamicIndexFooter}>{t('catalogueBuilder.indexFooter')}</footer>
            </section>
          ))}
          {selectedProducts.map((product) => {
            const tileFaces = product.media.filter((media) => media.role === 'tile-face');
            const randomFaces = tileFaces.length >= 3
              ? tileFaces.slice(1, 3)
              : tileFaces.length === 2
                ? [tileFaces[1], tileFaces[1]]
                : tileFaces.length === 1
                  ? [tileFaces[0], tileFaces[0]]
                  : [];
            const roomImages = product.media.filter((media) => media.role === 'preview');
            const pageNumbers = productPageNumbers[product.id];
            const variant = product.variants?.[0];
            const thickness = product.thickness || variant?.thickness || product.availableThickness;
            return (
              <Fragment key={product.id}>
                <section className={`${styles.cataloguePage} ${styles.landscapePage} ${styles.productPage}`}>
                  <div className={styles.tileHero}>
                    {tileFaces[0] ? <ProductImage id={tileFaces[0].id} alt={product.name} /> : <div className={styles.missingTile}>{product.name}</div>}
                    {logo && <img className={styles.flaisSeal} src="/catalogue-themes/flais-book/flais-seal.png" alt="Flais Granito" />}
                  </div>
                  <div className={`${styles.productDetails} ${randomFaces.length === 0 ? styles.productDetailsCompact : ''}`}>
                    <div className={styles.collectionMark}>
                      <strong>{(product.surface || product.collection || '').toUpperCase()}</strong>
                      <span>{t('catalogueBuilder.collectionLabel')}</span>
                    </div>
                    {randomFaces.length > 0 && (
                      <div className={styles.randomBlock}>
                        <div className={styles.randomGrid}>
                          {randomFaces.map((face, index) => (
                            <figure key={`${face.id}-${index}`}>
                              <ProductImage id={face.id} alt={`${product.name} ${t('catalogue.fields.faces')} ${index + 1}`} />
                              <figcaption>{face.id === tileFaces[0]?.id ? t('catalogueBuilder.mainTileImage') : t('catalogueBuilder.faceLabel', { number: tileFaces.findIndex((tileFace) => tileFace.id === face.id) })}</figcaption>
                            </figure>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className={styles.productIdentity}>
                      <h2>{product.name}</h2>
                      {product.extraName && <p>{product.extraName}</p>}
                    </div>
                    <dl className={styles.productSpecs}>
                      {[
                        [t('catalogue.fields.surface'), product.surface || variant?.surface || product.availableSurface || '—'],
                        [t('catalogue.fields.size'), product.size || variant?.size || product.availableSize || '—'],
                        [t('catalogue.fields.thickness'), thickness ? `${thickness}${/mm/i.test(thickness) ? '' : ' mm'}` : '—'],
                        [t('catalogue.fields.body'), product.body || variant?.body || product.availableBody || '—'],
                      ]
                        .map(([label, value]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                    </dl>
                    <a className={styles.returnToIndex} href="#catalogue-index">
                      <ArrowUpLeft size={14} strokeWidth={1.8} />
                      <span>{t('catalogueBuilder.returnToIndex')}</span>
                    </a>
                    <span className={styles.pageNumber}>{pageNumbers?.tilePage}</span>
                  </div>
                </section>
                {roomImages.map((room, index) => (
                  <section className={`${styles.cataloguePage} ${styles.landscapePage} ${styles.roomPage}`} key={room.id}>
                    <ProductImage id={room.id} alt={`${product.name} ${t('catalogueBuilder.roomLabel')}`} />
                    <footer className={styles.roomCaption}>
                      <strong>{product.name}</strong>
                      <span>{t('catalogueBuilder.roomLabel')} {String(index + 1).padStart(2, '0')}</span>
                      <span className={styles.roomPageNumber}>{pageNumbers?.previewPages[index]}</span>
                    </footer>
                  </section>
                ))}
              </Fragment>
            );
          })}
          {includeTechnical &&
            technicalPages.map((src, index) => (
              <section className={`${styles.cataloguePage} ${index === technicalPages.length - 1 ? styles.portraitPage : styles.landscapePage} ${styles.technicalPage}`} key={src}>
                <img className={styles.fullPageArtwork} src={src} alt={t('catalogueBuilder.technicalPageNumber', { number: index + 1 })} />
              </section>
            ))}
        </section>,
        printRoot,
      )}
    </main>
  );
}

function ProductImage({ id, alt }: { id: string; alt: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let alive = true;
    catalogueService.url(id).then((value) => {
      if (alive) setUrl(value);
    }).catch(() => {
      if (alive) setUrl('unavailable');
    });
    return () => {
      alive = false;
    };
  }, [id]);
  if (url === 'unavailable') return <span className={styles.photoUnavailable} data-print-image="failed">{alt}</span>;
  return url ? <img src={url} alt={alt} data-print-image="ready" /> : <span className={styles.photoLoading} data-print-image="pending" />;
}
