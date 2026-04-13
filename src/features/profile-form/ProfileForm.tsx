import {
  Button,
  Card,
  CardContent,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import { useForm, useStore } from "@tanstack/react-form";
import { Eye, EyeOff, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ZodError } from "zod";

import {
  managedEnvKeys,
  managedKeyLabels,
  type ManagedEnvKey,
  type Profile,
  type ProfileInput,
} from "@/shared/profiles";
import {
  hasBothCredentials,
  isValidUrl,
  normalizeProfileInput,
  validateProfileInput,
} from "@/shared/schema";

type ProfileFormProps = {
  mode: "create" | "edit";
  profile?: Profile;
  isSaving?: boolean;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onSubmit: (input: ProfileInput) => Promise<void>;
};

type FormValues = {
  name: string;
  env: Record<ManagedEnvKey, string>;
};

const emptyEnv = Object.fromEntries(managedEnvKeys.map((key) => [key, ""])) as Record<
  ManagedEnvKey,
  string
>;

function toFormValues(profile?: Profile): FormValues {
  return {
    name: profile?.name ?? "",
    env: {
      ...emptyEnv,
      ...profile?.env,
    },
  };
}

function getFieldType(key: ManagedEnvKey, showSecrets: boolean): string {
  if (key === "ANTHROPIC_API_KEY" || key === "ANTHROPIC_AUTH_TOKEN") {
    return showSecrets ? "text" : "password";
  }

  if (key === "ANTHROPIC_BASE_URL") {
    return "url";
  }

  return "text";
}

function mapZodIssuePath(path: PropertyKey[]): string | undefined {
  if (path[0] === "name") return "name";
  if (path[0] === "env" && path[1]) return `env.${String(path[1])}`;

  const key = String(path[0]);

  if (managedEnvKeys.includes(key as ManagedEnvKey)) return `env.${key}`;

  return undefined;
}

export function ProfileForm({
  mode,
  profile,
  isSaving = false,
  onCancel,
  onDirtyChange,
  onSubmit,
}: ProfileFormProps) {
  const initialValues = useMemo(() => toFormValues(profile), [profile]);
  const [showSecrets, setShowSecrets] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const inputClassName =
    "mt-2 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-subtle)] focus:border-[var(--app-border-strong)]";

  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: ({ value }) => {
        try {
          validateProfileInput(value);

          return undefined;
        } catch (error) {
          if (error instanceof ZodError) {
            const fields: Record<string, string> = {};

            for (const issue of error.issues) {
              const fieldPath = mapZodIssuePath(issue.path);

              if (fieldPath) {
                fields[fieldPath] = issue.message;
              }
            }

            return { fields };
          }

          return "Validation failed";
        }
      },
    },
    onSubmit: async ({ value }) => {
      setGeneralError(null);

      try {
        const payload = validateProfileInput(value);

        await onSubmit(payload);
      } catch (error) {
        setGeneralError(error instanceof Error ? error.message : "Failed to save profile.");
      }
    },
  });

  useEffect(() => {
    form.reset();
    setGeneralError(null);
  }, [initialValues, form]);

  const formValues = useStore(form.store, (state) => state.values);

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(normalizeProfileInput(formValues)) !==
      JSON.stringify(normalizeProfileInput(initialValues))
    );
  }, [formValues, initialValues]);

  const bothCredentialsSet = useStore(form.store, (state) => hasBothCredentials(state.values.env));

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <Card className="border border-[var(--app-border)] bg-[var(--app-surface)] shadow-none">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--app-text-subtle)]">
              {mode === "create" ? "New profile" : "Edit profile"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--app-text)]">
              {mode === "create" ? "Create a profile" : `Edit ${profile?.name ?? "profile"}`}
            </h2>
          </div>
          <Button
            variant="secondary"
            onPress={() => {
              setShowSecrets((current) => !current);
            }}
          >
            <span className="flex items-center gap-2">
              {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showSecrets ? "Hide secrets" : "Show secrets"}</span>
            </span>
          </Button>
        </div>

        <Form
          validationBehavior="aria"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="w-full space-y-6">
            <form.Field
              name="name"
              children={(field) => (
                <TextField
                  isInvalid={field.state.meta.errors.length > 0}
                  value={field.state.value}
                  onBlur={() => field.handleBlur()}
                  onChange={(val) => field.handleChange(val)}
                >
                  <Label className="text-sm font-medium text-[var(--app-text)]">Profile name</Label>
                  <Input className={inputClassName} type="text" />
                  <FieldError className="mt-2 text-sm text-rose-300">
                    {field.state.meta.errors[0]}
                  </FieldError>
                </TextField>
              )}
            />

            <div className="space-y-3">
              <p
                className={`text-xs ${bothCredentialsSet ? "text-rose-300" : "text-[var(--app-text-subtle)]"}`}
              >
                Provide either an API key or an auth token — at least one is required, but not both.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                {managedEnvKeys.map((key) => (
                  <form.Field
                    key={key}
                    name={`env.${key}` as `env.${ManagedEnvKey}`}
                    validators={{
                      onChange: ({ value, fieldApi }) => {
                        if (key === "ANTHROPIC_BASE_URL") {
                          const trimmed = value.trim();

                          if (trimmed && !isValidUrl(trimmed)) {
                            return "Base URL must be a valid URL.";
                          }
                        }

                        if (
                          key === "ANTHROPIC_AUTH_TOKEN" ||
                          key === "ANTHROPIC_API_KEY"
                        ) {
                          const otherKey =
                            key === "ANTHROPIC_AUTH_TOKEN"
                              ? "env.ANTHROPIC_API_KEY"
                              : "env.ANTHROPIC_AUTH_TOKEN";
                          const otherValue = fieldApi.form.getFieldValue(
                            otherKey as `env.${ManagedEnvKey}`,
                          );

                          if (value.trim() && otherValue?.trim()) {
                            return "Cannot set both API key and auth token.";
                          }
                        }

                        return undefined;
                      },
                      onChangeListenTo:
                        key === "ANTHROPIC_AUTH_TOKEN"
                          ? (["env.ANTHROPIC_API_KEY"] as `env.${ManagedEnvKey}`[])
                          : key === "ANTHROPIC_API_KEY"
                            ? (["env.ANTHROPIC_AUTH_TOKEN"] as `env.${ManagedEnvKey}`[])
                            : [],
                    }}
                    children={(field) => (
                      <TextField
                        isInvalid={field.state.meta.errors.length > 0}
                        value={field.state.value}
                        onBlur={() => field.handleBlur()}
                        onChange={(val) => field.handleChange(val)}
                      >
                        <Label className="text-sm font-medium text-[var(--app-text)]">
                          {managedKeyLabels[key]}
                        </Label>
                        <Input className={inputClassName} type={getFieldType(key, showSecrets)} />
                        <FieldError className="mt-2 text-sm text-rose-300">
                          {field.state.meta.errors[0]}
                        </FieldError>
                      </TextField>
                    )}
                  />
                ))}
              </div>
            </div>

            {generalError ? (
              <div className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {generalError}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onPress={onCancel}>
                Cancel
              </Button>
              <form.Subscribe
                selector={(state) => state.isSubmitting}
                children={(isSubmitting) => (
                  <Button
                    isDisabled={isSaving || isSubmitting}
                    type="submit"
                    variant="primary"
                  >
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      <span>
                        {isSaving
                          ? "Saving\u2026"
                          : mode === "create"
                            ? "Create profile"
                            : "Save changes"}
                      </span>
                    </span>
                  </Button>
                )}
              />
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
