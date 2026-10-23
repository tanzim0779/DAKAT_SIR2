/* ===== সব লিংক ও পেজ এখানে থেকেই নিয়ন্ত্রণ হবে =====
   নতুন পেজ বানানো হলে শুধু ready: true করুন। */

const SITE = {
  name: "Dakat Sir",

  // বাইরের লিংক (আপনার আসল লিংক বসান)
  links: {
    youtube: "videos/",
    tiktok:        "https://www.tiktok.com/",
    whatsapp:      "https://wa.me/8801XXXXXXXXX",
    facebookGroup: "https://www.facebook.com/groups/",
    facebookPage:  "https://www.facebook.com/",
    google:        "https://www.google.com/"
  },

  // ভেতরের পেজ (নতুন ট্যাবে খুলবে)
  pages: {
    theory:          { title: "থিওরি",              url: "pages/theory.html",           ready: false },
    practice:        { title: "প্র্যাকটিস",          url: "pages/practice.html",         ready: false },
    exam:            { title: "এক্সাম",              url: "pages/exam.html",             ready: false },
    course:          { title: "কোর্স",               url: "pages/course.html",           ready: false },
    progress:        { title: "প্রোগ্রেস ও মেসেজ",   url: "pages/progress.html",         ready: false },
    
    library:         { title: "লাইব্রেরি",           url: "pages/library.html",          ready: false },
     community:      { title: "community",            url: "community/index.html",         ready: true },
    profile:         { title: "প্রোফাইল",              url: "pages/profile.html",             ready: true },
    aboutCollege:    { title: "কলেজ সম্পর্কে",       url: "pages/about-college.html",    ready: false },
    aboutUniversity: { title: "বিশ্ববিদ্যালয় সম্পর্কে", url: "pages/about-university.html", ready: false }
  },

  openInNewTab: true   // false করলে একই ট্যাবে খুলবে
};
