env "local" {
  # تحديد مسار الملفات بالترتيب لضمان سلامة التبعيات (Dependencies)
  src = [
    "file://01_foundation.hcl",
    "file://02_CATALOG_INVENTORY.hcl",
    "file://03-Protocol.hcl",
    "file://04_commerce_crm.hcl",
    "file://05_marketing_systems.hcl",
    "file://06-SYSTEM.hcl"
  ]
  
  # Sovereign AI Architecture: Dedicated pgvector Dev-DB
  dev = "docker://pgvector/pgvector:pg16/test_db"

  # Dynamic deployment targets for Global Baseline
  url = "postgres://{{ .User }}:{{ .Pass }}@localhost:5432/{{ .DBName }}?search_path=public&sslmode=verify-full&sslrootcert={{ .SSLCertPath }}"
  
  # Protocol Alpha: Multi-Tenant Mapping (Enterprise Override)
  migration {
    dir = "file://migrations"
  }
}

# Protocol Gamma: DevSecOps Environment
env "dev" {
  src = "file://tenant.hcl"
  url = "postgres://{{ .User }}:{{ .Pass }}@localhost:5432/{{ .DBName }}?search_path=tenant_dev&sslmode=verify-full&sslrootcert={{ .SSLCertPath }}"
}
