import React from "react";
import Image from "next/image";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <section className="hidden w-1/3 items-center justify-center bg-brand p-10 lg:flex xl:w-1/3 ">
        <div className="flex max-h-[800px] max-w-[430px] flex-col justify-center space-y-12">
          <Image
            src="/assets/images/logo.png"
            alt="logo"
            width={224}
            height={224}
            className="h-auto"
          />

          <div className="space-y-5 text-white">
            <h1 className="h1">Manage your files the best way in a virtual DataRoom</h1>
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col items-center bg-white p-4 py-10 lg:justify-center lg:p-10 lg:py-0">
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <Image
            src="/assets/images/logo.png"
            alt="logo"
            width={512}
            height={512}
            className="h-auto w-[100px] lg:w-[250px]"
          />
        </div>

        {children}
      </section>
    </div>
  );
};

export default Layout;
