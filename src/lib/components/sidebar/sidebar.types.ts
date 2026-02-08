export type SidebarItemType = {
    label: string;
    href?: string;
    icon?: any; // distinct from 'component' type to allow flexible icon libraries
    children?: SidebarItemType[];
    isHeader?: boolean;
    onClick?: () => void;
};
