mod error;
mod mobile;
mod models;

use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime, State,
};

use mobile::DocumentIo;
use models::{
    PersistUriRequest, PersistUriResponse, ReadTextRequest, ReadTextResponse, WriteTextRequest,
    WriteTextResponse,
};

pub use error::{Error, Result};

trait DocumentIoExt<R: Runtime> {
    fn document_io(&self) -> State<'_, DocumentIo<R>>;
}

impl<R: Runtime, T: Manager<R>> DocumentIoExt<R> for T {
    fn document_io(&self) -> State<'_, DocumentIo<R>> {
        self.state::<DocumentIo<R>>()
    }
}

#[tauri::command]
fn read_text<R: Runtime>(
    app: tauri::AppHandle<R>,
    uri: String,
    max_bytes: u64,
) -> std::result::Result<ReadTextResponse, String> {
    app.document_io()
        .read_text(ReadTextRequest { uri, max_bytes })
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn write_text<R: Runtime>(
    app: tauri::AppHandle<R>,
    uri: String,
    content: String,
    max_bytes: u64,
) -> std::result::Result<WriteTextResponse, String> {
    app.document_io()
        .write_text(WriteTextRequest {
            uri,
            content,
            max_bytes,
        })
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn persist_uri<R: Runtime>(
    app: tauri::AppHandle<R>,
    uri: String,
    write: bool,
) -> std::result::Result<PersistUriResponse, String> {
    app.document_io()
        .persist_uri(PersistUriRequest { uri, write })
        .map_err(|error| error.to_string())
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("document-io")
        .setup(|app, api| {
            let document_io = mobile::init(app, api)?;
            app.manage(document_io);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![read_text, write_text, persist_uri])
        .build()
}
