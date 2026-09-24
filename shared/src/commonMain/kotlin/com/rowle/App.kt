package com.rowle

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import androidx.compose.ui.unit.sp
import com.rowle.data.Agenda
import com.rowle.data.eventById
import com.rowle.data.rememberFavoriteStore
import com.rowle.ui.AppScreen
import com.rowle.ui.EventDetailScreen
import com.rowle.ui.ExploreScreen
import com.rowle.ui.HomeScreen
import com.rowle.ui.SavedScreen
import com.rowle.ui.YouScreen
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
    val favoriteStore = rememberFavoriteStore()
    LaunchedEffect(Unit) {
        Agenda.load()
    }
    var screen by remember { mutableStateOf<AppScreen>(AppScreen.Home) }
    var tab by remember { mutableStateOf(MainTab.HOME) }
    var favoriteIds by remember { mutableStateOf(favoriteStore.load()) }

    fun toggleFavorite(id: String) {
        val next = if (id in favoriteIds) favoriteIds - id else favoriteIds + id
        favoriteIds = next
        favoriteStore.save(next)
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
                    Column(modifier = Modifier.background(Color.Black)) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .background(lime.copy(alpha = 0.35f))
                        )
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .navigationBarsPadding()
                                .padding(horizontal = 6.dp, vertical = 6.dp)
                        ) {
                            MainTab.entries.forEach { item ->
                                val selected = tab == item && screen is AppScreen.Home
                                val tint = if (selected) Color.Black else Color(0xFF8A8A8A)
                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(if (selected) lime else Color.Transparent)
                                        .clickable {
                                            tab = item
                                            screen = AppScreen.Home
                                        }
                                        .padding(vertical = 8.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(
                                        imageVector = item.icon,
                                        contentDescription = item.label,
                                        tint = tint,
                                        modifier = Modifier.size(22.dp)
                                    )
                                    Text(
                                        text = item.label,
                                        style = MaterialTheme.typography.labelLarge,
                                        color = tint,
                                        fontSize = 11.sp
                                    )
                                }
                            }
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
                        MainTab.EXPLORE -> {
                            ExploreScreen(
                                favoriteIds = favoriteIds,
                                onEventClick = { event ->
                                    screen = AppScreen.EventDetail(event.id)
                                },
                                onToggleFavorite = { toggleFavorite(it) },
                                modifier = Modifier.padding(innerPadding)
                            )
                        }
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
                        MainTab.YOU -> {
                            YouScreen(
                                savedCount = favoriteIds.size,
                                onOpenSaved = { tab = MainTab.SAVED },
                                modifier = Modifier.padding(innerPadding)
                            )
                        }
                    }
                }
            }
        }
    }
}
