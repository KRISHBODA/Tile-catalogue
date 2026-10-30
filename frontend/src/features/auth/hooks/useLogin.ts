"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context";
import { LoginFormState, LoginValidationError } from "../types";

export function useLogin() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
    rememberMe: true,
  });

  const [errors, setErrors] = useState<LoginValidationError>({});
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleInputChange = (field: keyof LoginFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof LoginValidationError]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const fillDemoCredentials = () => {
    setForm({
      email: "admin@tilecatalog.com",
      password: "Admin@Tile2026",
      rememberMe: true,
    });
    setErrors({});
    setErrorMessage("");
  };

  const validate = (): boolean => {
    const newErrors: LoginValidationError = {};
    if (!form.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });
      router.push("/products");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    errors,
    errorMessage,
    isSubmitting,
    showPassword,
    setShowPassword,
    handleInputChange,
    fillDemoCredentials,
    handleSubmit,
  };
}
