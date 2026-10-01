package com.rowle.data

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import com.rowle.model.Event
import platform.Foundation.NSURL
import platform.UIKit.UIApplication

@Composable
actual fun rememberPlanner(): Planner {
    return remember {
        object : Planner {
            override fun openMaps(event: Event) {
                openExternal(mapsSearchUrl(event.location))
            }

            override fun addToCalendar(event: Event) {
                openExternal(calendarPageUrl(event))
            }
        }
    }
}

private fun openExternal(url: String) {
    val link = NSURL.URLWithString(url) ?: return
    UIApplication.sharedApplication.openURL(link)
}
