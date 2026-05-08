import Image from "next/image";

export default function Logo(props: {
    width?: number;
    height?: number;
}) {
    return (
        <Image
            src="/images/logo.png"
            alt="Logo"
            width={props.width ?? 500}
            height={props.height ?? 65}
        />
    );
}
