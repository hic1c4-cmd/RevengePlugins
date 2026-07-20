import { findByProps } from "@revenge-mod/metro"
import { logger } from "@vendetta"
import { before } from "@vendetta/patcher"
import { storage } from "@vendetta/plugin"
import { getAssetIDByName } from "@vendetta/ui/assets"
import { showToast } from "@vendetta/ui/toasts"

import type { Rule } from "../def"

const Messages = findByProps("sendMessage", "receiveMessage")

const Warning = getAssetIDByName("ic_warning_24px")

export default function patchSendMessage() {
    return before("sendMessage", Messages, args => {
        // Rules, but filtering out ones with empty match arguments
        const rules = (storage.rules as Rule[]).filter(rule => rule.match)

        // The message content
        let content = args[1].content as string

        // Go through each rule and run the message through it
        for (const rule of rules) {
            if (rule.regex) {
                try {
                    const match = rule.match.trim()

                    // EVAL mode
                    if (match.startsWith("EVAL ")) {
                        const code = match.slice(5).trim()

                        const result = new Function(
                            "msg",
                            `return (${code})`
                        )(args[1])

                        content = String(result)
                        continue
                    }

                    // Normal RegExp mode
                    const pattern = new RegExp(rule.match, rule.flags)
                    content = content.replace(pattern, rule.replace)
                } catch (e) {
                    logger.error(e)
                    showToast(`Failed to process rule "${rule.name}"!`, Warning)
                }
            } else {
                // Normal string replacement
                content = content.replaceAll(rule.match, rule.replace)
            }
        }

        // Update message content with the updated content
        args[1].content = content
    })
}
