use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::{
    PersistUriRequest, PersistUriResponse, ReadTextRequest, ReadTextResponse, WriteTextRequest,
    WriteTextResponse,
};

const PLUGIN_IDENTIFIER: &str = "in.sanskar.markora.documentio";

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<DocumentIo<R>> {
    let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "DocumentIoPlugin")?;
    Ok(DocumentIo(handle))
}

pub struct DocumentIo<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> DocumentIo<R> {
    pub fn read_text(&self, payload: ReadTextRequest) -> crate::Result<ReadTextResponse> {
        self.0
            .run_mobile_plugin("readText", payload)
            .map_err(Into::into)
    }

    pub fn write_text(&self, payload: WriteTextRequest) -> crate::Result<WriteTextResponse> {
        self.0
            .run_mobile_plugin("writeText", payload)
            .map_err(Into::into)
    }

    pub fn persist_uri(&self, payload: PersistUriRequest) -> crate::Result<PersistUriResponse> {
        self.0
            .run_mobile_plugin("persistUri", payload)
            .map_err(Into::into)
    }
}
