package com.rowle.ui

import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rowle.data.eventAreas
import com.rowle.data.isToday
import com.rowle.data.sampleEvents
import com.rowle.model.Event

@Composable
fun HomeScreen(
    onEventClick: (Event) -> Unit,
    favoriteIds: Set<String>,
    onToggleFavorite: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var searchText by remember { mutableStateOf("") }
    var selectedArea by remember { mutableStateOf<String?>(null) }

    val filteredEvents = sampleEvents.filter { event ->
        val matchesArea = selectedArea == null || event.area == selectedArea
        val query = searchText.trim()
        val matchesSearch = query.isEmpty() ||
            event.title.contains(query, ignoreCase = true) ||
            event.category.contains(query, ignoreCase = true) ||
            event.location.contains(query, ignoreCase = true) ||
            event.area.contains(query, ignoreCase = true)
        matchesArea && matchesSearch
    }
    val emAlta = filteredEvents.filter { !isToday(it.date) }
    val hoje = filteredEvents.filter { isToday(it.date) }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(top = 20.dp, bottom = 24.dp)
    ) {
        item {
            Header(modifier = Modifier.padding(horizontal = 16.dp))
        }

        item {
            Spacer(modifier = Modifier.height(14.dp))
            PlaceStrip(
                selectedArea = selectedArea,
                onSelect = { area ->
                    selectedArea = if (selectedArea == area) null else area
                }
            )
        }

        item {
            OutlinedTextField(
                value = searchText,
                onValueChange = { searchText = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 16.dp),
                singleLine = true,
                placeholder = {
                    Text("Buscar um evento")
                },
                leadingIcon = {
                    Icon(Icons.Filled.Search, contentDescription = null)
                },
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF3A3A3A),
                    unfocusedBorderColor = Color(0xFF2A2A2A),
                    focusedContainerColor = Color(0xFF111111),
                    unfocusedContainerColor = Color(0xFF111111)
                )
            )
        }

        if (filteredEvents.isEmpty()) {
            item {
                EmptyEvents(
                    searchText = searchText,
                    selectedArea = selectedArea,
                    onClearFilters = {
                        searchText = ""
                        selectedArea = null
                    }
                )
            }
        } else {
            if (emAlta.isNotEmpty()) {
                item {
                    SectionHeader(
                        title = "EM ALTA",
                        subtitle = "O que mais tá saindo essa semana"
                    )
                }
                item {
                    EventPosterRow(
                        events = emAlta,
                        favoriteIds = favoriteIds,
                        onEventClick = onEventClick,
                        onToggleFavorite = onToggleFavorite
                    )
                }
            }

            if (hoje.isNotEmpty()) {
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    SectionHeader(
                        title = "HOJE",
                        subtitle = "Ainda dá tempo de ir"
                    )
                }
                item {
                    EventPosterRow(
                        events = hoje,
                        favoriteIds = favoriteIds,
                        onEventClick = onEventClick,
                        onToggleFavorite = onToggleFavorite
                    )
                }
            }
        }
    }
}

@Composable
private fun Header(modifier: Modifier = Modifier) {
    val lime = MaterialTheme.colorScheme.primary

    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Filled.Place,
                contentDescription = null,
                tint = lime,
                modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "ROWLÊ",
                color = lime,
                style = MaterialTheme.typography.headlineLarge
            )
            Spacer(modifier = Modifier.weight(1f))
            Text(
                text = "BSB / DF",
                color = lime,
                style = MaterialTheme.typography.labelLarge,
                fontSize = 12.sp,
                modifier = Modifier
                    .border(1.dp, lime, RoundedCornerShape(4.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }

        Text(
            text = "O que tá rolando em Brasília hoje.",
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun PlaceStrip(
    selectedArea: String?,
    onSelect: (String) -> Unit
) {
    val lime = MaterialTheme.colorScheme.primary
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        eventAreas.forEachIndexed { index, area ->
            if (index > 0) {
                Text(
                    text = "·",
                    color = lime.copy(alpha = 0.45f),
                    style = MaterialTheme.typography.labelLarge
                )
            }
            val selected = selectedArea == area
            Text(
                text = area.uppercase(),
                color = if (selected) lime else lime.copy(alpha = 0.4f),
                style = MaterialTheme.typography.labelLarge,
                modifier = Modifier.clickable { onSelect(area) }
            )
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    subtitle: String
) {
    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Text(
            text = title,
            color = Color.White,
            style = MaterialTheme.typography.displayLarge
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = subtitle,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 13.sp
        )
    }
}

@Composable
private fun EventPosterRow(
    events: List<Event>,
    favoriteIds: Set<String>,
    onEventClick: (Event) -> Unit,
    onToggleFavorite: (String) -> Unit
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(events, key = { it.id }) { event ->
            EventCard(
                event = event,
                isFavorite = event.id in favoriteIds,
                onToggleFavorite = { onToggleFavorite(event.id) },
                onClick = { onEventClick(event) }
            )
        }
    }
}

@Composable
private fun EmptyEvents(
    searchText: String,
    selectedArea: String?,
    onClearFilters: () -> Unit
) {
    val hasFilters = searchText.isNotBlank() || selectedArea != null
    val title: String
    val subtitle: String
    when {
        searchText.isNotBlank() -> {
            title = "Nada por “${searchText.trim()}”"
            subtitle = "Tenta outro nome, ou limpa a busca e os filtros."
        }
        selectedArea != null -> {
            title = "Nenhum rolê em $selectedArea"
            subtitle = "Escolhe outro lugar ou vê todos os eventos."
        }
        else -> {
            title = "Nenhum evento por aqui"
            subtitle = "Quando tiver rolê novo, aparece nessa lista."
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 28.dp, horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = title,
            fontSize = 18.sp,
            style = MaterialTheme.typography.titleLarge.copy(
                fontSize = 22.sp,
                color = MaterialTheme.colorScheme.onBackground
            ),
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = subtitle,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        if (hasFilters) {
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedButton(onClick = onClearFilters) {
                Text("Limpar filtros")
            }
        }
    }
}
