package com.rowle.data

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import platform.UIKit.UIActivityViewController
import platform.UIKit.UIApplication
import platform.UIKit.UIViewController

@Composable
actual fun rememberSharer(): Sharer {
    return remember {
        Sharer { text ->
            val controller = UIActivityViewController(
                activityItems = listOf(text),
                applicationActivities = null
            )
            val presenter = topViewController() ?: return@Sharer
            controller.popoverPresentationController?.sourceView = presenter.view
            presenter.presentViewController(controller, animated = true, completion = null)
        }
    }
}

private fun topViewController(): UIViewController? {
    var current = UIApplication.sharedApplication.keyWindow?.rootViewController
    while (current?.presentedViewController != null) {
        current = current?.presentedViewController
    }
    return current
}
