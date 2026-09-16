package com.rowle.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
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
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rowle.data.eventCategories
import com.rowle.data.isThisWeekend
import com.rowle.data.isToday
import com.rowle.data.isTomorrow
import com.rowle.data.sampleEvents
import com.rowle.model.Event
import com.rowle.ui.theme.Hairline

private enum class WhenFilter(val label: String) {
    ALL("Todos"),
    TODAY("Hoje"),
    TOMORROW("Amanhã"),
    WEEKEND("Fim de semana")
}

@Composable
fun ExploreScreen(
    favoriteIds: Set<String>,
    onEventClick: (Event) -> Unit,
    onToggleFavorite: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var searchText by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<String?>(null) }
    var whenFilter by remember { mutableStateOf(WhenFilter.ALL) }

    val filtered = sampleEvents.filter { event ->
        val matchesCategory = selectedCategory == null || event.category == selectedCategory
        val matchesWhen = when (whenFilter) {
            WhenFilter.ALL -> true
            WhenFilter.TODAY -> isToday(event.date)
            WhenFilter.TOMORROW -> isTomorrow(event.date)
            WhenFilter.WEEKEND -> isThisWeekend(event.date)
        }
        val query = searchText.trim()
        val matchesSearch = query.isEmpty() ||
            event.title.contains(query, ignoreCase = true) ||
            event.category.contains(query, ignoreCase = true) ||
            event.location.contains(query, ignoreCase = true) ||
            event.area.contains(query, ignoreCase = true)
        matchesCategory && matchesWhen && matchesSearch
    }
    val hasFilters = searchText.isNotBlank() || selectedCategory != null || whenFilter != WhenFilter.ALL
    val categoryLabels = listOf("Todos") + eventCategories
    val categoryIndex = if (selectedCategory == null) 0 else eventCategories.indexOf(selectedCategory) + 1

    Column(modifier = modifier.fillMaxSize()) {
        Text(
            text = "EXPLORAR",
            style = MaterialTheme.typography.displayLarge,
            modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 20.dp)
        )
        LimeSlash(modifier = Modifier.padding(start = 16.dp, top = 8.dp, bottom = 4.dp))
        Text(
            text = "Cava a cidade do seu jeito",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
        )

        OutlinedTextField(
            value = searchText,
            onValueChange = { searchText = it },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            singleLine = true,
            placeholder = { Text("Buscar um rolê") },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
            shape = RectangleShape,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color(0xFF3A3A3A),
                unfocusedBorderColor = Hairline,
                focusedContainerColor = Color(0xFF111111),
                unfocusedContainerColor = Color(0xFF111111)
            )
        )

        FilterGroup(
            title = "CATEGORIA",
            labels = categoryLabels,
            selectedIndex = categoryIndex.coerceAtLeast(0),
            onSelect = { index ->
                selectedCategory = if (index == 0) null else eventCategories[index - 1]
            }
        )
        FilterGroup(
            title = "QUANDO",
            labels = WhenFilter.entries.map { it.label },
            selectedIndex = whenFilter.ordinal,
            onSelect = { index ->
                whenFilter = WhenFilter.entries[index]
            }
        )

        if (filtered.isEmpty()) {
            EmptyExplore(
                searchText = searchText,
                hasFilters = hasFilters,
                onClearFilters = {
                    searchText = ""
                    selectedCategory = null
                    whenFilter = WhenFilter.ALL
                }
            )
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(filtered, key = { it.id }) { event ->
                    EventCard(
                        event = event,
                        isFavorite = event.id in favoriteIds,
                        onToggleFavorite = { onToggleFavorite(event.id) },
                        onClick = { onEventClick(event) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}

@Composable
private fun FilterGroup(
    title: String,
    labels: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit
) {
    Column(modifier = Modifier.padding(bottom = 8.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelLarge,
            color = Color(0xFF8A8A8A),
            fontSize = 11.sp,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
        )
        ChipRow(
            labels = labels,
            selectedIndex = selectedIndex,
            onSelect = onSelect
        )
    }
}

@Composable
private fun ChipRow(
    labels: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit
) {
    val lime = MaterialTheme.colorScheme.primary
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        labels.forEachIndexed { index, label ->
            val on = index == selectedIndex
            Text(
                text = label.uppercase(),
                style = MaterialTheme.typography.labelLarge,
                color = if (on) Color.Black else Color(0xFFB3B3B3),
                modifier = Modifier
                    .background(if (on) lime else Color(0xFF111111))
                    .border(
                        width = 1.dp,
                        color = if (on) lime else Hairline,
                        shape = RectangleShape
                    )
                    .clickable { onSelect(index) }
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            )
        }
    }
}

@Composable
private fun EmptyExplore(
    searchText: String,
    hasFilters: Boolean,
    onClearFilters: () -> Unit
) {
    val title: String
    val subtitle: String
    when {
        searchText.isNotBlank() -> {
            title = "Ela ainda não achou “${searchText.trim()}”"
            subtitle = "Tenta outro nome, ou limpa a busca e os filtros."
        }
        hasFilters -> {
            title = "Ela ainda não achou com isso"
            subtitle = "Tenta outra categoria, data ou busca."
        }
        else -> {
            title = "Ela ainda não achou"
            subtitle = "Quando tiver rolê novo, aparece nessa lista."
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                textAlign = TextAlign.Center
            )
            Text(
                text = subtitle,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 8.dp)
            )
            if (hasFilters) {
                OutlinedButton(
                    onClick = onClearFilters,
                    modifier = Modifier.padding(top = 16.dp)
                ) {
                    Text("Limpar filtros")
                }
            }
        }
    }
}
