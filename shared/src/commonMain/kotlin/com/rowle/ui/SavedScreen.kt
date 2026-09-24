package com.rowle.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rowle.data.agendaReady
import com.rowle.data.nextEvents
import com.rowle.model.Event

@Composable
fun SavedScreen(
    favoriteIds: Set<String>,
    onEventClick: (Event) -> Unit,
    onToggleFavorite: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val saved = nextEvents.filter { it.id in favoriteIds }

    Column(modifier = modifier.fillMaxSize()) {
        Text(
            text = "SALVOS",
            style = MaterialTheme.typography.displayLarge,
            modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 20.dp)
        )
        LimeSlash(modifier = Modifier.padding(start = 16.dp, top = 8.dp, bottom = 4.dp))
        Text(
            text = "Pra não perder de vista",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
        )

        if (!agendaReady) {
            Box(modifier = Modifier.fillMaxSize())
        } else if (saved.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Nada na toca",
                        style = MaterialTheme.typography.titleLarge,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "Marca o coração num evento pra achar ele aqui.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(saved, key = { it.id }) { event ->
                    EventCard(
                        event = event,
                        isFavorite = true,
                        onToggleFavorite = { onToggleFavorite(event.id) },
                        onClick = { onEventClick(event) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}
