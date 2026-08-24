use std::sync::Mutex;

mod commands;
mod file_watch;

struct PendingOpenedUrls(Mutex<Vec<String>>);

#[tauri::command]
fn take_opened_urls(state: tauri::State<'_, PendingOpenedUrls>) -> Vec<String> {
    let Ok(mut pending) = state.0.lock() else {
        return Vec::new();
    };
    std::mem::take(&mut *pending)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(PendingOpenedUrls(Mutex::new(Vec::new())))
        .invoke_handler(tauri::generate_handler![
            commands::open_markdown_file,
            commands::read_markdown_file,
            commands::save_markdown_file,
            commands::export_html_file,
            commands::save_backup_file,
            commands::open_backup_file,
            commands::open_external_url,
            commands::app_version,
            file_watch::file_fingerprint,
            take_opened_urls,
        ])
        .build(tauri::generate_context!())
        .expect("failed to build Markora");

    app.run(|_app_handle, _event| {
        #[cfg(any(target_os = "macos", target_os = "ios", target_os = "android"))]
        if let tauri::RunEvent::Opened { urls } = _event {
            use tauri::{Emitter as _, Manager as _};

            let payload = urls.iter().map(ToString::to_string).collect::<Vec<_>>();
            if let Ok(mut pending) = _app_handle.state::<PendingOpenedUrls>().0.lock() {
                pending.extend(payload.iter().cloned());
            }
            let _ = _app_handle.emit("opened-files", payload);
        }
    });
}
