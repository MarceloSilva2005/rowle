package com.rowle.data

import com.rowle.ui.theme.AppTheme

object ThemePreferences {
    fun read(): AppTheme {
        val raw = readThemeName() ?: return AppTheme.AMOLED
        return runCatching { AppTheme.valueOf(raw) }.getOrDefault(AppTheme.AMOLED)
    }

    fun write(theme: AppTheme) {
        writeThemeName(theme.name)
    }
}

internal expect fun readThemeName(): String?

internal expect fun writeThemeName(name: String)
