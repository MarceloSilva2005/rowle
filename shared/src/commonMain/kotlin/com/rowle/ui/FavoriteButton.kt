package com.rowle.ui

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color

@Composable
fun FavoriteButton(
    isFavorite: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    inactiveTint: Color = Color.White
) {
    IconButton(onClick = onClick, modifier = modifier) {
        Icon(
            imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
            contentDescription = if (isFavorite) "Remover dos salvos" else "Salvar evento",
            tint = if (isFavorite) MaterialTheme.colorScheme.primary else inactiveTint
        )
    }
}
