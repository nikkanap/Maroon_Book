import sharedStyles from "~/styles/shared.module.css";

import Link from "next/link";
import type { PropsWithChildren } from "react";

export function LinkButton(props: PropsWithChildren<{ href: string; className?: string }>) {
    return (
        <Link
            href={props.href}
            rel="noopener noreferrer"
            className={props.className ?? sharedStyles.link}
        >
            {props.children}
        </Link>
    );
}
