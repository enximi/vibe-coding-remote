package com.enximi.voicebridge

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.enximi.voicebridge.data.PreferencesManager
import com.enximi.voicebridge.ui.Composer
import com.enximi.voicebridge.ui.Dock
import com.enximi.voicebridge.ui.MainViewModel
import com.enximi.voicebridge.ui.MainViewModelFactory
import com.enximi.voicebridge.ui.SettingsSheet
import com.enximi.voicebridge.ui.theme.VoiceBridgeTheme

class MainActivity : ComponentActivity() {
    private lateinit var preferencesManager: PreferencesManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        preferencesManager = PreferencesManager(applicationContext)
        
        setContent {
            val viewModel: MainViewModel = viewModel(
                factory = MainViewModelFactory(preferencesManager)
            )
            val themeMode by viewModel.themeMode.collectAsState()
            val systemDark = isSystemInDarkTheme()
            val isDarkTheme = when (themeMode) {
                "dark" -> true
                "light" -> false
                else -> systemDark
            }
            
            VoiceBridgeTheme(darkTheme = isDarkTheme) {
                MainScreen(viewModel)
            }
        }
    }
}

@Composable
fun MainScreen(viewModel: MainViewModel) {
    val serverUrl by viewModel.serverUrl.collectAsState()
    val enterToSend by viewModel.enterToSend.collectAsState()
    val themeMode by viewModel.themeMode.collectAsState()
    val inputText by viewModel.inputText.collectAsState()
    val sendHistory by viewModel.sendHistory.collectAsState()
    val statusMessage by viewModel.statusMessage.collectAsState()
    val isSending by viewModel.isSending.collectAsState()
    
    val showCopy by viewModel.showCopy.collectAsState()
    val showPaste by viewModel.showPaste.collectAsState()
    val showTab by viewModel.showTab.collectAsState()
    val showNewline by viewModel.showNewline.collectAsState()
    val showBackspace by viewModel.showBackspace.collectAsState()
    
    var showSettings by remember { mutableStateOf(false) }
    var focusSignal by remember { mutableIntStateOf(0) }
    val snackbarHostState = remember { SnackbarHostState() }
    val focusManager = LocalFocusManager.current

    LaunchedEffect(statusMessage) {
        if (statusMessage.isNotBlank()) {
            snackbarHostState.showSnackbar(statusMessage)
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { _ ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding() // Handles status bar, nav bar, and IME seamlessly
        ) {
            // Main Composer Input
            Composer(
                text = inputText,
                enterToSend = enterToSend,
                focusSignal = focusSignal,
                onTextChanged = { viewModel.updateInputText(it) },
                onSubmit = { viewModel.submitFromKeyboard() },
                onEmptyBackspace = { viewModel.handleEmptyBackspace() },
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp)
                    .padding(top = 8.dp, bottom = 24.dp)
            )
            
            // The Dock
            Dock(
                onSettingsClick = {
                    focusManager.clearFocus()
                    showSettings = true
                },
                showCopy = showCopy,
                showPaste = showPaste,
                showTab = showTab,
                showNewline = showNewline,
                showBackspace = showBackspace,
                onTab = { viewModel.sendKey("tab") },
                onCopy = { viewModel.sendKey("copy") },
                onPaste = { viewModel.sendKey("paste") },
                onBackspace = { viewModel.sendKey("backspace") },
                onNewline = { viewModel.sendKey("newline") },
                onSend = { viewModel.sendText() },
                canSend = inputText.isNotBlank() && !isSending,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
            )
        }
        
        if (showSettings) {
            SettingsSheet(
                serverUrl = serverUrl,
                onServerUrlChange = { viewModel.updateServerUrl(it) },
                enterToSend = enterToSend,
                onEnterToSendChange = { viewModel.updateEnterToSend(it) },
                themeMode = themeMode,
                onThemeModeChange = { viewModel.updateThemeMode(it) },
                showCopy = showCopy,
                onShowCopyChange = { viewModel.updateShowCopy(it) },
                showPaste = showPaste,
                onShowPasteChange = { viewModel.updateShowPaste(it) },
                showTab = showTab,
                onShowTabChange = { viewModel.updateShowTab(it) },
                showNewline = showNewline,
                onShowNewlineChange = { viewModel.updateShowNewline(it) },
                showBackspace = showBackspace,
                onShowBackspaceChange = { viewModel.updateShowBackspace(it) },
                sendHistory = sendHistory,
                onHistoryItemClick = { item ->
                    viewModel.applyHistoryItem(item)
                    showSettings = false
                    focusSignal++
                },
                onClearHistoryClick = { viewModel.clearSendHistory() },
                onDismissRequest = {
                    showSettings = false
                    focusSignal++
                }
            )
        }
    }
}
