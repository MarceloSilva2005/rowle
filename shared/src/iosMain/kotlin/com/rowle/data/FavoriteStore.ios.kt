package com.rowle.data

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import platform.Foundation.NSUserDefaults

private const val KEY_FAVORITES = "favorite_ids"

private class IosFavoriteStore : FavoriteStore {
    private val defaults = NSUserDefaults.standardUserDefaults

    override fun load(): Set<String> {
        val stored = defaults.stringForKey(KEY_FAVORITES) ?: return emptySet()
        if (stored.isBlank()) return emptySet()
        return stored.split(',').filter { it.isNotBlank() }.toSet()
    }

    override fun save(ids: Set<String>) {
        defaults.setObject(ids.joinToString(","), KEY_FAVORITES)
    }
}

@Composable
actual fun rememberFavoriteStore(): FavoriteStore {
    return remember { IosFavoriteStore() }
}
