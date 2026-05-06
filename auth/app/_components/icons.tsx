import { Shield } from "lucide-react";

export const AppLogoIcon = ({ className }: { className?: string }) => (
  <Shield fill="currentColor" className={className}/>
  // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
  //     <path d="M11.47 3.84a.75.75 0 011.06 0l8.635 8.635a.75.75 0 11-1.06 1.06l-8.635-8.635a.75.75 0 010-1.06z" />
  //     <path d="M12 6.621v11.758a.75.75 0 01-1.5 0V6.621a.75.75 0 011.5 0z" />
  //     <path d="M3.375 12a.75.75 0 01.75-.75h15.75a.75.75 0 010 1.5H4.125a.75.75 0 01-.75-.75z" />
  // </svg>
);

export const TelegramLogoIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 1000 1000"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
      <path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M178 458c192-84 319-139 383-165 182-76 220-89 244-89 7 0 18 1 26 8 7 5 8 12 9 17l2 26c-11 104-53 355-75 472-9 49-28 66-45 67-38 3-66-25-103-50l-147-98c-64-42-22-66 14-104 10-10 177-162 181-177 0-1 0-8-4-12-4-2-9-2-13-1-5 1-98 63-276 184a125 125 0 0 1-71 26c-24-1-68-14-102-25-41-13-74-20-71-43 1-12 18-24 48-36z" />
  </svg>
);

export const MaxLogoIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 1000 1000"
    fill="none"
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M508 878c-75 0-110-11-170-54-39 49-160 87-165 21 0-49-11-91-24-136-14-57-31-119-31-210 0-217 178-379 388-379 211 0 376 171 376 381 1 207-166 376-374 377zm3-571c-102-6-182 65-200 177-14 92 11 204 34 210 10 3 37-19 53-36 28 19 60 31 93 33 106 6 197-75 204-182 4-106-77-196-184-202z" />
  </svg>
);