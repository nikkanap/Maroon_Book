import NavigationBar from "~/app/_components/navigationBar";
import { LinkButton } from "./links";
import navStyles from "~/styles/nav.module.css";

export default function HomepageNav() {
    return (
        <NavigationBar>
            <LinkButton href="" className={navStyles.navLink}>
                About Us
            </LinkButton>

            <LinkButton href="/register" className={navStyles.navLink}>
                Register
            </LinkButton>

            <LinkButton href="/login" className={navStyles.navLink}>
                Login
            </LinkButton>
        </NavigationBar>
    );
}
