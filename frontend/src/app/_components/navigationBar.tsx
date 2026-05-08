import styles from "~/styles/nav.module.css";

import Logo from "./logo";
import type { PropsWithChildren } from "react";
import { LinkButton } from "./links";

export default function NavigationBar(props: PropsWithChildren) {
    return (
        <header className={styles.nav}>
            <LinkButton href="/" className={styles.logo}>
                <Logo width={217} height={26} />
            </LinkButton>

            <div className={styles.navButtons}>
                { props.children }
            </div>
        </header>
    );
}
