package com.enximi.voicebridge.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.enximi.voicebridge.data.PreferencesManager

class MainViewModelFactory(
    private val preferencesManager: PreferencesManager
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MainViewModel::class.java)) {
            return MainViewModel(preferencesManager) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
