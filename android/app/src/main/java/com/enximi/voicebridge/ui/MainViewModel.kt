package com.enximi.voicebridge.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.enximi.voicebridge.data.HistoryItem
import com.enximi.voicebridge.data.PreferencesManager
import com.enximi.voicebridge.network.VoiceBridgeApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(
    private val preferencesManager: PreferencesManager
) : ViewModel() {

    val serverUrl: StateFlow<String> = preferencesManager.serverUrlFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, "")
        
    val enterToSend: StateFlow<Boolean> = preferencesManager.enterToSendFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, false)

    val themeMode: StateFlow<String> = preferencesManager.themeModeFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, "auto")

    val sendHistory: StateFlow<List<HistoryItem>> =
        preferencesManager.sendHistoryFlow
            .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val showCopy: StateFlow<Boolean> = preferencesManager.showCopyFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, true)

    val showPaste: StateFlow<Boolean> = preferencesManager.showPasteFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, true)

    val showTab: StateFlow<Boolean> = preferencesManager.showTabFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, true)

    val showNewline: StateFlow<Boolean> = preferencesManager.showNewlineFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, true)

    val showBackspace: StateFlow<Boolean> = preferencesManager.showBackspaceFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, true)

    private val _inputText = MutableStateFlow("")
    val inputText: StateFlow<String> = _inputText.asStateFlow()
    
    private val _statusMessage = MutableStateFlow("")
    val statusMessage: StateFlow<String> = _statusMessage.asStateFlow()

    private val _isSending = MutableStateFlow(false)
    val isSending: StateFlow<Boolean> = _isSending.asStateFlow()

    fun updateInputText(text: String) {
        _inputText.value = text
    }

    fun updateServerUrl(url: String) {
        viewModelScope.launch {
            preferencesManager.saveServerUrl(url)
        }
    }

    fun updateEnterToSend(enabled: Boolean) {
        viewModelScope.launch {
            preferencesManager.saveEnterToSend(enabled)
        }
    }

    fun updateThemeMode(mode: String) {
        viewModelScope.launch {
            preferencesManager.saveThemeMode(mode)
        }
    }

    fun updateShowCopy(show: Boolean) {
        viewModelScope.launch {
            preferencesManager.saveShowCopy(show)
        }
    }

    fun updateShowPaste(show: Boolean) {
        viewModelScope.launch {
            preferencesManager.saveShowPaste(show)
        }
    }

    fun updateShowTab(show: Boolean) {
        viewModelScope.launch {
            preferencesManager.saveShowTab(show)
        }
    }

    fun updateShowNewline(show: Boolean) {
        viewModelScope.launch {
            preferencesManager.saveShowNewline(show)
        }
    }

    fun updateShowBackspace(show: Boolean) {
        viewModelScope.launch {
            preferencesManager.saveShowBackspace(show)
        }
    }

    fun sendText() {
        val currentText = _inputText.value
        val currentUrl = serverUrl.value

        if (currentUrl.isBlank()) {
            _statusMessage.value = "请先填写电脑端地址"
            return
        }

        if (currentText.isBlank()) return

        viewModelScope.launch {
            _isSending.value = true
            _statusMessage.value = "正在发送..."
            try {
                VoiceBridgeApi.typeText(currentUrl, currentText)
                preferencesManager.addSendHistoryEntry(currentText)
                _inputText.value = ""
                _statusMessage.value = "发送成功"
            } catch (e: Exception) {
                _statusMessage.value = "发送失败: ${e.message}"
            } finally {
                _isSending.value = false
            }
        }
    }

    fun sendKey(keyAction: String) {
        val currentUrl = serverUrl.value
        if (currentUrl.isBlank()) {
            _statusMessage.value = "请先填写电脑端地址"
            return
        }

        viewModelScope.launch {
            try {
                VoiceBridgeApi.pressKey(currentUrl, keyAction)
            } catch (e: Exception) {
                _statusMessage.value = "键击失败: ${e.message}"
            }
        }
    }

    fun submitFromKeyboard() {
        if (_inputText.value.isBlank()) {
            sendKey("enter")
        } else if (enterToSend.value) {
            sendText()
        } else {
            updateInputText("${_inputText.value}\n")
        }
    }

    fun handleEmptyBackspace() {
        sendKey("backspace")
    }

    fun applyHistoryItem(item: HistoryItem) {
        _inputText.value = item.text
    }

    fun clearSendHistory() {
        viewModelScope.launch {
            preferencesManager.clearSendHistory()
            _statusMessage.value = "已清空历史记录"
        }
    }
}
