import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

export const tabBarColors = {
   active: '#2E86DE',     // blue
   inactive: '#95A5A6',   // gray
   doctor: '#27AE60',     // green
   patient: '#8E44AD',    // purple
}

export const commonTabOptions: BottomTabNavigationOptions = {
   headerShown: false,
   tabBarHideOnKeyboard: true,
   tabBarStyle: {
     height: 60,
     paddingBottom: 6,
   },
};