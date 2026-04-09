package com.enximi.voicebridge.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

object VoiceBridgeApi {
    suspend fun typeText(serverUrl: String, text: String) {
        withContext(Dispatchers.IO) {
            request(
                method = "POST",
                url = buildUrl(serverUrl, "/api/type-text"),
                requestBody = JSONObject()
                    .put("text", text)
                    .toString(),
            )
        }
    }

    suspend fun pressKey(serverUrl: String, key: String) {
        withContext(Dispatchers.IO) {
            request(
                method = "POST",
                url = buildUrl(serverUrl, "/api/press-key"),
                requestBody = JSONObject()
                    .put("key", key)
                    .toString(),
            )
        }
    }

    private fun buildUrl(serverUrl: String, path: String): String {
        val normalizedServerUrl = serverUrl.trim().trimEnd('/')
        val normalizedPath = path.trimStart('/')
        return "$normalizedServerUrl/$normalizedPath"
    }

    private fun request(
        method: String,
        url: String,
        requestBody: String? = null,
    ): String {
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 5_000
            readTimeout = 5_000
            useCaches = false
        }

        return try {
            if (requestBody != null) {
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                connection.outputStream.bufferedWriter(Charsets.UTF_8).use { writer ->
                    writer.write(requestBody)
                }
            }

            val responseCode = connection.responseCode
            val responseBody = readResponseBody(connection)

            if (responseCode in 200..299) {
                responseBody
            } else {
                val detail = responseBody.ifBlank { "no response body" }
                throw IOException("HTTP $responseCode: $detail")
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun readResponseBody(connection: HttpURLConnection): String {
        val stream = connection.inputStream ?: connection.errorStream ?: return ""
        return stream.bufferedReader(Charsets.UTF_8).use { reader ->
            reader.readText()
        }
    }
}
