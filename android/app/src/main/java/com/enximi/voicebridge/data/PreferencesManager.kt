package com.enximi.voicebridge.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import org.json.JSONArray
import org.json.JSONObject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "voice_bridge_settings")

class PreferencesManager(private val context: Context) {
    private val historyLimit = 50

    companion object {
        val SERVER_URL = stringPreferencesKey("server_url")
        val ENTER_TO_SEND = booleanPreferencesKey("enter_to_send")
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val SEND_HISTORY = stringPreferencesKey("send_history")
        
        val SHOW_COPY = booleanPreferencesKey("show_copy")
        val SHOW_PASTE = booleanPreferencesKey("show_paste")
        val SHOW_TAB = booleanPreferencesKey("show_tab")
        val SHOW_NEWLINE = booleanPreferencesKey("show_newline")
        val SHOW_BACKSPACE = booleanPreferencesKey("show_backspace")
    }

    val serverUrlFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[SERVER_URL] ?: ""
    }

    val enterToSendFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[ENTER_TO_SEND] ?: false
    }

    val themeModeFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[THEME_MODE] ?: "auto"
    }

    val sendHistoryFlow: Flow<List<HistoryItem>> = context.dataStore.data.map { preferences ->
        decodeHistory(preferences[SEND_HISTORY])
    }

    val showCopyFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[SHOW_COPY] ?: true
    }

    val showPasteFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[SHOW_PASTE] ?: true
    }

    val showTabFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[SHOW_TAB] ?: true
    }

    val showNewlineFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[SHOW_NEWLINE] ?: true
    }

    val showBackspaceFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[SHOW_BACKSPACE] ?: true
    }

    suspend fun saveServerUrl(url: String) {
        context.dataStore.edit { preferences ->
            preferences[SERVER_URL] = url
        }
    }

    suspend fun saveEnterToSend(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[ENTER_TO_SEND] = enabled
        }
    }

    suspend fun saveThemeMode(mode: String) {
        context.dataStore.edit { preferences ->
            preferences[THEME_MODE] = mode
        }
    }

    suspend fun addSendHistoryEntry(text: String) {
        val normalizedText = text.trim()
        if (normalizedText.isEmpty()) return
        val now = System.currentTimeMillis()

        context.dataStore.edit { preferences ->
            val currentHistory = decodeHistory(preferences[SEND_HISTORY])
            val updatedHistory = buildList {
                add(HistoryItem(text = normalizedText, time = now))
                currentHistory
                    .asSequence()
                    .filterNot { it.text == normalizedText }
                    .take(historyLimit - 1)
                    .forEach(::add)
            }

            preferences[SEND_HISTORY] = encodeHistory(updatedHistory)
        }
    }

    suspend fun clearSendHistory() {
        context.dataStore.edit { preferences ->
            preferences.remove(SEND_HISTORY)
        }
    }

    suspend fun saveShowCopy(show: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[SHOW_COPY] = show
        }
    }

    suspend fun saveShowPaste(show: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[SHOW_PASTE] = show
        }
    }

    suspend fun saveShowTab(show: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[SHOW_TAB] = show
        }
    }

    suspend fun saveShowNewline(show: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[SHOW_NEWLINE] = show
        }
    }

    suspend fun saveShowBackspace(show: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[SHOW_BACKSPACE] = show
        }
    }

    private fun decodeHistory(encoded: String?): List<HistoryItem> {
        if (encoded.isNullOrBlank()) return emptyList()

        return runCatching {
            val array = JSONArray(encoded)
            buildList {
                for (index in 0 until array.length()) {
                    when (val item = array.opt(index)) {
                        is JSONObject -> {
                            val text = item.optString("text")
                            if (text.isNotBlank()) {
                                add(
                                    HistoryItem(
                                        text = text,
                                        time = item.optLong("time", 0L),
                                    )
                                )
                            }
                        }
                        is String -> {
                            if (item.isNotBlank()) {
                                add(HistoryItem(text = item, time = 0L))
                            }
                        }
                    }
                }
            }
        }.getOrDefault(emptyList())
    }

    private fun encodeHistory(history: List<HistoryItem>): String {
        return JSONArray(
            history.map { item ->
                JSONObject()
                    .put("text", item.text)
                    .put("time", item.time)
            }
        ).toString()
    }
}
