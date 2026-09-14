package com.rowle.ui

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rowle.data.eventCategories
import com.rowle.data.isThisWeekend
import com.rowle.data.isToday
import com.rowle.data.sampleEvents
import com.rowle.model.Event

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun HomeScreen(
    onEventClick: (Event) -> Unit,
    modifier: Modifier = Modifier
) {
    var searchText by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<String?>(null) }
    var selectedWhen by remember { mutableStateOf(WhenFilter.ALL) }

    val filteredEvents = sampleEvents.filter { event ->
        val matchesCategory = selectedCategory == null || event.category == selectedCategory
        val matchesWhen = when (selectedWhen) {
            WhenFilter.ALL -> true
            WhenFilter.TODAY -> isToday(event.date)
            WhenFilter.WEEKEND -> isThisWeekend(event.date)
        }
        val query = searchText.trim()
        val matchesSearch = query.isEmpty() ||
            event.title.contains(query, ignoreCase = true) ||
            event.category.contains(query, ignoreCase = true) ||
            event.location.contains(query, ignoreCase = true)
        matchesCategory && matchesWhen && matchesSearch
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(
            top = 20.dp,
            bottom = 16.dp
        ),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Header()
        }

        item {
            OutlinedTextField(
                value = searchText,
                onValueChange = { searchText = it },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                placeholder = {
                    Text("Buscar eventos")
                },
                leadingIcon = {
                    Icon(Icons.Filled.Search, contentDescription = null)
                },
                shape = RoundedCornerShape(14.dp)
            )
        }

        item {
            Text(
                text = "Categorias",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = selectedCategory == null,
                    onClick = { selectedCategory = null },
                    label = { Text("Todos") }
                )
                eventCategories.forEach { category ->
                    FilterChip(
                        selected = selectedCategory == category,
                        onClick = {
                            selectedCategory = if (selectedCategory == category) null else category
                        },
                        label = { Text(category) }
                    )
                }
            }
        }

        item {
            Text(
                text = "Quando",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = selectedWhen == WhenFilter.ALL,
                    onClick = { selectedWhen = WhenFilter.ALL },
                    label = { Text("Todos") }
                )
                FilterChip(
                    selected = selectedWhen == WhenFilter.TODAY,
                    onClick = {
                        selectedWhen = if (selectedWhen == WhenFilter.TODAY) WhenFilter.ALL else WhenFilter.TODAY
                    },
                    label = { Text("Hoje") }
                )
                FilterChip(
                    selected = selectedWhen == WhenFilter.WEEKEND,
                    onClick = {
                        selectedWhen = if (selectedWhen == WhenFilter.WEEKEND) WhenFilter.ALL else WhenFilter.WEEKEND
                    },
                    label = { Text("Fim de semana") }
                )
            }
        }

        item {
            Text(
                text = "Eventos próximos",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        if (filteredEvents.isEmpty()) {
            item {
                EmptyEvents(
                    searchText = searchText,
                    selectedCategory = selectedCategory,
                    selectedWhen = selectedWhen,
                    onClearFilters = {
                        searchText = ""
                        selectedCategory = null
                        selectedWhen = WhenFilter.ALL
                    }
                )
            }
        } else {
            items(filteredEvents, key = { it.id }) { event ->
                EventCard(
                    event = event,
                    onClick = { onEventClick(event) }
                )
            }
        }
    }
}

@Composable
private fun Header() {
    val lime = MaterialTheme.colorScheme.primary

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
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
                fontSize = 32.sp,
                fontWeight = FontWeight.Black,
                fontStyle = FontStyle.Italic,
                letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.weight(1f))
            Text(
                text = "BSB / DF",
                color = lime,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
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

private enum class WhenFilter {
    ALL, TODAY, WEEKEND
}

@Composable
private fun EmptyEvents(
    searchText: String,
    selectedCategory: String?,
    selectedWhen: WhenFilter,
    onClearFilters: () -> Unit
) {
    val hasFilters = searchText.isNotBlank() ||
        selectedCategory != null ||
        selectedWhen != WhenFilter.ALL

    val title: String
    val subtitle: String
    when {
        searchText.isNotBlank() -> {
            title = "Nada por “${searchText.trim()}”"
            subtitle = "Tenta outro nome, ou limpa a busca e os filtros."
        }
        selectedWhen == WhenFilter.TODAY -> {
            title = "Nada pra hoje"
            subtitle = "Olha o fim de semana ou tira o filtro de data."
        }
        selectedWhen == WhenFilter.WEEKEND -> {
            title = "Nada nesse fim de semana"
            subtitle = "Tira o filtro ou escolhe outra categoria."
        }
        selectedCategory != null -> {
            title = "Nenhum rolê de $selectedCategory"
            subtitle = "Escolhe outra categoria ou vê todos os eventos."
        }
        else -> {
            title = "Nenhum evento por aqui"
            subtitle = "Quando tiver rolê novo, aparece nessa lista."
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 28.dp, horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = title,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onBackground
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


