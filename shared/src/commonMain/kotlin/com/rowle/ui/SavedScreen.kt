package com.rowle.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rowle.data.agendaReady
import com.rowle.data.dayTitle
import com.rowle.data.isToday
import com.rowle.data.sampleEvents
import com.rowle.model.Event

@Composable
fun SavedScreen(
    favoriteIds: Set<String>,
    onEventClick: (Event) -> Unit,
    onToggleFavorite: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val saved = sampleEvents.filter { it.id in favoriteIds }
    val days = saved.map { it.date }.distinct().sorted()

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
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 24.dp)
            ) {
                days.forEachIndexed { index, date ->
                    val sessions = saved.filter { it.date == date }
                    item {
                        if (index > 0) {
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        SectionHeader(
                            title = dayTitle(date),
                            subtitle = if (isToday(date)) "Ainda dá tempo de ir" else null
                        )
                    }
                    item {
                        EventPosterRow(
                            events = sessions,
                            favoriteIds = favoriteIds,
                            onEventClick = onEventClick,
                            onToggleFavorite = onToggleFavorite
                        )
                    }
                }
            }
        }
    }
}
