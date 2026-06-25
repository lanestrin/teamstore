import {
    LuShoppingCart,
    LuHeart,
    LuDollarSign,
    LuShieldCheck
} from "react-icons/lu";

import styles from "./FeaturesBar.module.scss";

const features = [
    {
        icon: <LuShoppingCart />,
        title: "ONE CART",
        text: "Multiple stores. One checkout."
    },
    {
        icon: <LuHeart />,
        title: "SUPPORT LOCAL TEAMS",
        text: "Every purchase supports a team."
    },
    {
        icon: <LuDollarSign />,
        title: "EASY FUNDRAISING",
        text: "Raise money with every order."
    },
    {
        icon: <LuShieldCheck />,
        title: "BUILT FOR TEAMS",
        text: "Designed for schools and clubs."
    }
];

export default function FeaturesBar() {
    return (
        <section className={styles.features}>
            <div className={styles.container}>
                {features.map((feature) => (
                    <div
                        key={feature.title}
                        className={styles.feature}
                    >
                        <div className={styles.icon}>
                            {feature.icon}
                        </div>

                        <div>
                            <h3>{feature.title}</h3>
                            <p>{feature.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
