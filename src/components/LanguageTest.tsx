import { Button, Stack, Typography } from "@mui/material";
import { useLanguage } from "../context/LanguageContext";

export const LanguageTest = () => {
    const { t, language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === "en" ? "ar" : "en");
    };

    return (
        <Stack spacing={2} alignItems="center" sx={{ p: 3 }}>
            <Typography variant="h5">
                {t("common.testMessage")}
            </Typography>
            <Button 
                variant="contained" 
                onClick={toggleLanguage}
                sx={{ minWidth: 200 }}
            >
                {language === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
            </Button>
        </Stack>
    );
}; 