import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import '../globals.css'

export const metadata = {
    title : 'Threads Account',
    description : 'Threads App'
}

const intern = Inter({subsets : ['latin']})

export default function RootLayout({children} : {children : React.ReactNode  }) {
    return <ClerkProvider>
        <html lang="en">
            <body className={`${intern.className} bg-dark-1`}>
                <div className="w-full flex justify-center items-center min-h-screen">
                    {children}
                </div>
            </body>
        </html>
    </ClerkProvider>
}