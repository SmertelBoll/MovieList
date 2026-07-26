// Спільна розкладка «героя» для сторінок Info (Actor / Crew / Company / Genre).
// Усі чотири були скопійовані одна з одної: height 400px і жорсткий рядок
// «фіксоване зображення + текст», що ламалось на вузьких екранах.
// Тримаємо стилі в одному місці, щоб наступна правка була одна, а не чотири.

// Зовнішній блок. Фон кожна сторінка додає свій — але ТІЛЬКИ через backgroundImage.
// Скорочений `background` скидає backgroundSize/backgroundPosition нижче до
// початкових значень (auto / 0% 0%), і зображення прилипає до лівого верхнього кута.
export const heroSectionSx = {
    position: "relative",
    // На телефоні висоту диктує вміст, на десктопі — звичні 400px
    minHeight: { xs: "auto", sm: 400 },
    borderRadius: 2,
    overflow: "hidden",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

// Внутрішній контейнер: вертикально на телефоні, горизонтально від sm
export const heroInnerSx = {
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    gap: { xs: 2, sm: 3 },
    alignItems: "center",
    maxWidth: "1200px",
    width: "100%",
    minWidth: 0,
    p: { xs: 2, sm: 3 },
};

// Портретне фото людини (було 200×300)
export const heroPortraitSx = {
    width: { xs: 150, sm: 170, md: 200 },
    height: { xs: 225, sm: 255, md: 300 },
    flexShrink: 0,
    boxShadow: 3,
    borderRadius: 2,
};

// Горизонтальна плитка — лого чи банер (було 300×200).
// На телефоні тягнеться на всю ширину; висота всюди фіксована, щоб дочірні
// елементи з height: '100%' мали від чого рахуватись.
export const heroLandscapeSx = {
    width: { xs: "100%", sm: 240, md: 300 },
    height: { xs: 170, sm: 160, md: 200 },
    flexShrink: 0,
    boxShadow: 3,
    borderRadius: 2,
};

// Зображення всередині картки
export const heroMediaSx = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
};

// Текстова колонка поруч із зображенням
export const heroInfoSx = {
    flex: 1,
    minWidth: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 1,
    textAlign: { xs: "center", sm: "left" },
    alignItems: { xs: "center", sm: "stretch" },
};

// Назва сторінки (замість h3 у 3rem на будь-якій ширині)
export const heroTitleSx = {
    fontWeight: "bold",
    fontSize: { xs: "1.5rem", sm: "2.125rem", md: "3rem" },
    lineHeight: 1.2,
    overflowWrap: "anywhere",
};

// Рядки під назвою (були h6 = 1.25rem)
export const heroSubtitleSx = {
    fontSize: { xs: "0.95rem", sm: "1.25rem" },
};

// Блок із цифрами під текстом
export const heroStatsSx = {
    mt: { xs: 2, sm: 3 },
    display: "flex",
    gap: { xs: 3, sm: 4 },
    flexWrap: "wrap",
    justifyContent: { xs: "center", sm: "flex-start" },
};

export const heroStatValueSx = {
    fontWeight: "bold",
    color: "primary.main",
    fontSize: { xs: "1.5rem", sm: "2.125rem" },
};
