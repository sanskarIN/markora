const COMMANDS: &[&str] = &[
    "open_markdown_file",
    "read_markdown_file",
    "save_markdown_file",
    "export_html_file",
    "save_backup_file",
    "open_backup_file",
    "open_external_url",
    "app_version",
    "file_fingerprint",
    "take_opened_urls",
];

fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(COMMANDS)),
    )
    .expect("failed to build Markora Tauri permissions");
}
