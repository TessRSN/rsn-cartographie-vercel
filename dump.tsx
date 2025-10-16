 return (
    <div className="h-[50vh] w-screen">
      <div className="absolute top-2 z-10 p-4 flex justify-center w-full">
        <div className="bg-base-200  rounded-xl w-2/3 xl:max-w-[800px] h-16 outline-base-100 outline-2 max-w- items-center justify-between flex p-4 py-6">
          <img className="" src="/L_RSN_FR_RGB_W-400x145.png" width={120} />
          <div className="rounded-full outline-gray-300/50 outline-2 p-4 w-28 h-8 flex items-center justify-between hover:cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              className="-ml-0.5 size-4 fill-gray-600 dark:fill-gray-500"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd"
              ></path>
            </svg>
            <kbd className="font-sans text-xs/4 text-gray-500 dark:text-gray-400">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>
      <DiagramRoot nodes={nodes} edges={edges}></DiagramRoot>
    </div>
  );
}


imageSrc:
        org.metatag.find(
          (tag) => tag.tag === "link" && tag.attributes.rel === "image_src"
        )?.attributes.href || null,


        imageSrc: 
      // First check attributes
      org.attributes?.field_image?.uri?.url ||
      org.attributes?.field_logo?.uri?.url ||
      org.attributes?.field_media_image?.uri?.url ||
      // Then check metatags as fallback
      org.metatag?.find(
        (tag) => tag.tag === "link" && tag.attributes.rel === "image_src"
      )?.attributes.href || 
      null,
