import {Ellipsis} from 'lucide-react';

import {Button} from '@/components/ui/button.tsx';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu.tsx';
import {useIsMobile} from '@/hooks/use-mobile';

export type OptionsButtonProps = {
    options: {
        label: string,
        icon?: React.ReactElement,
        onClick?: () => void
    }[]
}

export const OptionsButton = (props: OptionsButtonProps) => {
    const isMobile = useIsMobile();
    const options = props.options;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-10">
                    <Ellipsis/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
            >
                {
                    options.map((option, index) => (
                            <>
                                {index > 0 && <DropdownMenuSeparator/>}
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <DropdownMenuItem onClick={option.onClick}>
                                        {option.icon}
                                        {option.label}
                                    </DropdownMenuItem>
                                </DropdownMenuLabel>
                            </>
                        )
                    )
                }
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
