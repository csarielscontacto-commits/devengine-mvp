import { z } from 'zod';

// 1. Definición de Entorno (Variables de entorno)
const EnvVarSchema = z.object({
  key: z.string().regex(/^[A-Z0-9_]+$/, 'Debe ser MAYÚSCULAS_CON_GUIONES'),
  description: z.string(),
  example: z.string().optional(),
  scope: z.enum(['public', 'server-only']),
  sensitive: z.boolean().default(false),
});

// 2. Definición de Base de Datos
const ColumnSchema = z.object({
  name: z.string(),
  type: z.string(),
  primary_key: z.boolean().optional(),
  default: z.string().optional(),
  nullable: z.boolean().optional(),
  references: z.string().optional(),
  check: z.string().optional(),
});

const TableSchema = z.object({
  name: z.string(),
  rls_enabled: z.boolean().default(true),
  columns: z.array(ColumnSchema).min(1),
});

// 3. Definición de Endpoints (API)
const EndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string().startsWith('/'),
  auth_required: z.boolean(),
  request_body: z.record(z.string()).optional(),
  response_2xx: z.record(z.string()).optional(),
  business_rules: z.array(z.string()).optional(),
});

// 4. Esquema Principal del Blueprint (El Contrato)
export const BlueprintSchema = z.object({
  meta: z.object({
    blueprint_version: z.literal('1.0.0'),
    project_name: z.string(),
    project_slug: z.string(),
    description: z.string(),
    stack: z.object({
      frontend: z.literal('nextjs-14-app-router'),
      backend: z.literal('nextjs-api-routes'),
      database: z.literal('supabase-postgres'),
      deploy: z.literal('vercel'),
      auth: z.literal('supabase-auth'),
      styling: z.literal('tailwindcss'),
    }),
  }),
  requirements: z.object({
    user_stories: z.array(
      z.object({
        id: z.string(),
        actor: z.string(),
        goal: z.string(),
        so_that: z.string(),
        acceptance_criteria: z.array(z.string()),
      })
    ),
    out_of_scope: z.array(z.string()).default([]),
  }),
  database: z.object({
    provider: z.literal('supabase'),
    tables: z.array(TableSchema),
  }),
  api: z.object({
    base_path: z.string().default('/api'),
    endpoints: z.array(EndpointSchema),
  }),
  env: z.object({
    required: z.array(EnvVarSchema),
    external_services: z.array(z.any()).optional(),
  }),
  file_tree: z.record(z.array(z.string())), // Ej: { "app/": ["page.tsx"] }
  dependencies: z.object({
    runtime: z.array(z.string()),
    dev: z.array(z.string()),
  }),
  checks: z.object({
    must_build: z.boolean().default(true),
    must_typecheck: z.boolean().default(true),
    forbidden_patterns: z.array(z.string()),
  }),
});

// Exportamos el tipo de TypeScript inferido del esquema
export type Blueprint = z.infer<typeof BlueprintSchema>;
