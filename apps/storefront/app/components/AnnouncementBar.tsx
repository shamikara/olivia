import { ANNOUNCEMENTS } from "../lib/site";

export function AnnouncementBar() {
  // Rendered twice so the marquee loop is seamless at -50%.
  const items = [...ANNOUNCEMENTS, ...ANNOUNCEMENTS];

  return (
    <div className="announcement">
      <div className="announcement-track">
        {items.map((item, index) => (
          <span className="announcement-item" key={`${item}-${index}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
