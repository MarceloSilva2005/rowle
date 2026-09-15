package com.rowle

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.backhandler.BackHandler
import androidx.compose.ui.unit.dp
import com.rowle.data.eventById
import com.rowle.ui.AppScreen
import com.rowle.ui.EventDetailScreen
import com.rowle.ui.HomeScreen
import com.rowle.ui.SavedScreen
import com.rowle.ui.theme.RowleTheme

private enum class MainTab(
    val label: String,
    val icon: ImageVector
) {
    HOME("INÍCIO", Icons.Filled.Home),
    EXPLORE("EXPLORAR", Icons.Filled.Search),
    SAVED("SALVOS", Icons.Filled.Favorite),
    YOU("VOCÊ", Icons.Filled.Person)
}

@Composable
fun App() {
    var screen by remember { mutableStateOf<AppScreen>(AppScreen.Home) }
    var tab by remember { mutableStateOf(MainTab.HOME) }
    var favoriteIds by remember { mutableStateOf(setOf<String>()) }

    fun toggleFavorite(id: String) {
        favoriteIds = if (id in favoriteIds) favoriteIds - id else favoriteIds + id
    }

    val canGoBack = screen !is AppScreen.Home
    BackHandler(enabled = canGoBack) {
        screen = AppScreen.Home
    }

    RowleTheme {
        val showBottomBar = screen !is AppScreen.EventDetail
        val lime = MaterialTheme.colorScheme.primary

        Scaffold(
            modifier = Modifier.fillMaxSize(),
            containerColor = MaterialTheme.colorScheme.background,
            bottomBar = {
                if (showBottomBar) {
                    NavigationBar(
                        containerColor = Color.Black,
                        contentColor = lime
                    ) {
                        MainTab.entries.forEach { item ->
                            val selected = tab == item && screen is AppScreen.Home
                            NavigationBarItem(
                                selected = selected,
                                onClick = {
                                    tab = item
                                    screen = AppScreen.Home
                                },
                                icon = { Icon(item.icon, contentDescription = item.label) },
                                label = {
                                    Text(
                                        text = item.label,
                                        style = MaterialTheme.typography.labelLarge
                                    )
                                },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Color.Black,
                                    selectedTextColor = Color.Black,
                                    indicatorColor = lime,
                                    unselectedIconColor = Color(0xFF8A8A8A),
                                    unselectedTextColor = Color(0xFF8A8A8A)
                                )
                            )
                        }
                    }
                }
            }
        ) { innerPadding ->
            when (val current = screen) {
                is AppScreen.EventDetail -> {
                    val event = eventById(current.eventId)
                    if (event != null) {
                        EventDetailScreen(
                            event = event,
                            isFavorite = event.id in favoriteIds,
                            onToggleFavorite = { toggleFavorite(event.id) },
                            onBack = { screen = AppScreen.Home }
                        )
                    } else {
                        HomeScreen(
                            onEventClick = { clicked ->
                                screen = AppScreen.EventDetail(clicked.id)
                            },
                            favoriteIds = favoriteIds,
                            onToggleFavorite = { toggleFavorite(it) },
                            modifier = Modifier.padding(innerPadding)
                        )
                    }
                }

                is AppScreen.Home -> {
                    when (tab) {
                        MainTab.HOME -> {
                            HomeScreen(
                                onEventClick = { event ->
                                    screen = AppScreen.EventDetail(event.id)
                                },
                                favoriteIds = favoriteIds,
                                onToggleFavorite = { toggleFavorite(it) },
                                modifier = Modifier.padding(innerPadding)
                            )
                        }
                        MainTab.EXPLORE -> ComingSoon("Explorar", Modifier.padding(innerPadding))
                        MainTab.SAVED -> {
                            SavedScreen(
                                favoriteIds = favoriteIds,
                                onEventClick = { event ->
                                    screen = AppScreen.EventDetail(event.id)
                                },
                                onToggleFavorite = { toggleFavorite(it) },
                                modifier = Modifier.padding(innerPadding)
                            )
                        }
                        MainTab.YOU -> ComingSoon("Você", Modifier.padding(innerPadding))
                    }
                }
            }
        }
    }
}

@Composable
private fun ComingSoon(title: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = title.uppercase(),
                style = MaterialTheme.typography.displayLarge
            )
            Text(
                text = "Essa aba ainda vai entrar.",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
