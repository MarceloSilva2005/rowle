package com.rowle.data

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext

private const val PREFS_NAME = "rowle"
private const val KEY_FAVORITES = "favorite_ids"

private class AndroidFavoriteStore(
    context: Context
) : FavoriteStore {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    override fun load(): Set<String> {
        val stored = prefs.getString(KEY_FAVORITES, "") ?: return emptySet()
        if (stored.isBlank()) return emptySet()
        return stored.split(',').filter { it.isNotBlank() }.toSet()
    }

    override fun save(ids: Set<String>) {
        prefs.edit().putString(KEY_FAVORITES, ids.joinToString(",")).apply()
    }
}

@Composable
actual fun rememberFavoriteStore(): FavoriteStore {
    val context = LocalContext.current.applicationContext
    return remember(context) { AndroidFavoriteStore(context) }
}
