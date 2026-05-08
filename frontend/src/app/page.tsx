import styles from "./page.module.css";
import sharedStyles from "~/styles/shared.module.css";

import Nav from "~/app/_components/homepageNav";
import { api, HydrateClient } from "~/trpc/server";
import Logo from "./_components/logo";
import { LinkButton } from "./_components/links";

export default async function Home() {
    // const hello = await api.post.hello({ text: "from tRPC" });

    // void api.post.getLatest.prefetch();

    return (
        <HydrateClient>
            <div className={`${styles.page} ${sharedStyles.imageBackground}`}>
                <Nav />

                <main className={styles.main}>
                    <div className={styles.intro}>
                        <Logo />

                        <h1>
                            The premier Examination Information Management System for the University of the Philippines.
                        </h1>

                        <p>
                            Maroon Book can serve as the main platform for managing all of your class examinations.
                        </p>
                    </div>

                    <div className={styles.buttonsDiv}>
                        <LinkButton href="/register" className={`primaryButton ${styles.homeButton}`}>
                            Register an Account
                        </LinkButton>

                        <LinkButton href="/login" className={`primaryButton ${styles.homeButton}`}>
                            Login to an Account
                        </LinkButton>
                    </div>
                </main>
            </div>
        </HydrateClient>
    );
}
