mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::open_markdown_file,
            commands::read_markdown_file,
            commands::save_markdown_file,
            commands::export_html_file,
            commands::save_backup_file,
            commands::open_backup_file,
            commands::open_external_url,
            commands::app_version,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Markora");
}
