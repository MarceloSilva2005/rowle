package com.rowle

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.backhandler.BackHandler
import com.rowle.data.eventById
import com.rowle.ui.AppScreen
import com.rowle.ui.EventDetailScreen
import com.rowle.ui.HomeScreen
import com.rowle.ui.theme.RowleTheme

@Composable
fun App() {
    var screen by remember { mutableStateOf<AppScreen>(AppScreen.Home) }

    val canGoBack = screen !is AppScreen.Home
    BackHandler(enabled = canGoBack) {
        screen = AppScreen.Home
    }

    RowleTheme {
        val showBottomBar = screen !is AppScreen.EventDetail

        Scaffold(
            modifier = Modifier.fillMaxSize(),
            containerColor = MaterialTheme.colorScheme.background,
            bottomBar = {
                if (showBottomBar) {
                    NavigationBar {
                        NavigationBarItem(
                            selected = screen is AppScreen.Home,
                            onClick = { screen = AppScreen.Home },
                            icon = { Text("🏠") },
                            label = { Text("Início") }
                        )
                    }
                }
            }
        ) { innerPadding ->
            when (val current = screen) {
                is AppScreen.Home -> {
                    HomeScreen(
                        onEventClick = { event ->
                            screen = AppScreen.EventDetail(event.id)
                        },
                        modifier = Modifier.padding(innerPadding)
                    )
                }

                is AppScreen.EventDetail -> {
                    val event = eventById(current.eventId)
                    if (event != null) {
                        EventDetailScreen(
                            event = event,
                            onBack = { screen = AppScreen.Home }
                        )
                    } else {
                        HomeScreen(
                            onEventClick = { clicked ->
                                screen = AppScreen.EventDetail(clicked.id)
                            },
                            modifier = Modifier.padding(innerPadding)
                        )
                    }
                }
            }
        }
    }
}
