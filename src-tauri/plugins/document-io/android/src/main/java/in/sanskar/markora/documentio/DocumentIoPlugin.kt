package in.sanskar.markora.documentio

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.ByteArrayOutputStream
import java.io.FileNotFoundException
import java.nio.ByteBuffer
import java.nio.charset.CodingErrorAction
import java.nio.charset.StandardCharsets
import kotlin.concurrent.thread

private const val ABSOLUTE_MAX_BYTES = 32L * 1024L * 1024L
private const val IO_ERROR = "The requested Android document operation could not be completed."
private const val INVALID_URI = "Only user-selected Android content documents are supported."
private const val TOO_LARGE = "The selected file exceeds Markora's safety limit."
private const val INVALID_UTF8 = "The selected file is not valid UTF-8 text."

@InvokeArg
class ReadTextArgs {
    var uri: String = ""
    var maxBytes: Long = 0
}

@InvokeArg
class WriteTextArgs {
    var uri: String = ""
    var content: String = ""
    var maxBytes: Long = 0
}

@InvokeArg
class PersistUriArgs {
    var uri: String = ""
    var write: Boolean = false
}

@TauriPlugin
class DocumentIoPlugin(private val activity: Activity) : Plugin(activity) {
    @Command
    fun readText(invoke: Invoke) {
        val args = invoke.parseArgs(ReadTextArgs::class.java)
        val maxBytes = validatedLimit(args.maxBytes, invoke) ?: return
        val uri = contentUri(args.uri, invoke) ?: return

        thread(name = "markora-document-read") {
            try {
                val bytes = readBounded(uri, maxBytes)
                val decoder = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                val content = decoder.decode(ByteBuffer.wrap(bytes)).toString()
                val response = JSObject()
                response.put("content", content)
                response.put("name", displayName(uri))
                response.put("size", bytes.size.toLong())
                resolveOnUi(invoke, response)
            } catch (_: DocumentTooLargeException) {
                rejectOnUi(invoke, TOO_LARGE)
            } catch (_: java.nio.charset.CharacterCodingException) {
                rejectOnUi(invoke, INVALID_UTF8)
            } catch (_: Exception) {
                rejectOnUi(invoke, IO_ERROR)
            }
        }
    }

    @Command
    fun writeText(invoke: Invoke) {
        val args = invoke.parseArgs(WriteTextArgs::class.java)
        val maxBytes = validatedLimit(args.maxBytes, invoke) ?: return
        val uri = contentUri(args.uri, invoke) ?: return
        val bytes = args.content.toByteArray(StandardCharsets.UTF_8)
        if (bytes.size.toLong() > maxBytes) {
            invoke.reject(TOO_LARGE)
            return
        }

        thread(name = "markora-document-write") {
            try {
                val resolver = activity.contentResolver
                val output = try {
                    resolver.openOutputStream(uri, "wt")
                } catch (_: FileNotFoundException) {
                    resolver.openOutputStream(uri, "rwt")
                } ?: throw FileNotFoundException()

                output.use { stream ->
                    stream.write(bytes)
                    stream.flush()
                }

                val response = JSObject()
                response.put("name", displayName(uri))
                response.put("size", bytes.size.toLong())
                resolveOnUi(invoke, response)
            } catch (_: Exception) {
                rejectOnUi(invoke, IO_ERROR)
            }
        }
    }

    @Command
    fun persistUri(invoke: Invoke) {
        val args = invoke.parseArgs(PersistUriArgs::class.java)
        val uri = contentUri(args.uri, invoke) ?: return
        val resolver = activity.contentResolver
        var persisted = false

        val requestedFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION or
            if (args.write) Intent.FLAG_GRANT_WRITE_URI_PERMISSION else 0
        try {
            resolver.takePersistableUriPermission(uri, requestedFlags)
            persisted = true
        } catch (_: SecurityException) {
            if (args.write) {
                try {
                    resolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    persisted = true
                } catch (_: SecurityException) {
                    persisted = false
                }
            }
        }

        val response = JSObject()
        response.put("persisted", persisted)
        invoke.resolve(response)
    }

    private fun readBounded(uri: Uri, maxBytes: Long): ByteArray {
        val input = activity.contentResolver.openInputStream(uri) ?: throw FileNotFoundException()
        return input.use { stream ->
            val output = ByteArrayOutputStream()
            val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
            var total = 0L
            while (true) {
                val count = stream.read(buffer)
                if (count < 0) break
                total += count.toLong()
                if (total > maxBytes) throw DocumentTooLargeException()
                output.write(buffer, 0, count)
            }
            output.toByteArray()
        }
    }

    private fun displayName(uri: Uri): String? {
        return try {
            activity.contentResolver.query(
                uri,
                arrayOf(OpenableColumns.DISPLAY_NAME),
                null,
                null,
                null,
            )?.use { cursor ->
                if (!cursor.moveToFirst()) return@use null
                val column = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (column < 0) null else cursor.getString(column)
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun contentUri(raw: String, invoke: Invoke): Uri? {
        val uri = try {
            Uri.parse(raw)
        } catch (_: Exception) {
            null
        }
        if (uri == null || uri.scheme != "content") {
            invoke.reject(INVALID_URI)
            return null
        }
        return uri
    }

    private fun validatedLimit(raw: Long, invoke: Invoke): Long? {
        if (raw <= 0L || raw > ABSOLUTE_MAX_BYTES) {
            invoke.reject(TOO_LARGE)
            return null
        }
        return raw
    }

    private fun resolveOnUi(invoke: Invoke, response: JSObject) {
        activity.runOnUiThread { invoke.resolve(response) }
    }

    private fun rejectOnUi(invoke: Invoke, message: String) {
        activity.runOnUiThread { invoke.reject(message) }
    }
}

private class DocumentTooLargeException : RuntimeException()
