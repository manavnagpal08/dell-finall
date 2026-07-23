const fs = require('fs');
let text = fs.readFileSync('frontend/app/recommendations/page.tsx', 'utf8');

text = text.replace(
  '<button className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-green-600 shadow-sm">',
  '<button onClick={() => handleSimulate(0)} className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-green-600 shadow-sm">'
);

text = text.replace(
  '<button className="flex-1 py-2.5 bg-white border border-gray-200 text-blue-600 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50">',
  '<button onClick={() => handleSimulate(1)} className="flex-1 py-2.5 bg-white border border-gray-200 text-blue-600 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50">'
);

text = text.replace(
  '<button className="flex-1 py-2.5 bg-white border border-gray-200 text-orange-500 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50">',
  '<button onClick={() => handleSimulate(2)} className="flex-1 py-2.5 bg-white border border-gray-200 text-orange-500 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50">'
);

fs.writeFileSync('frontend/app/recommendations/page.tsx', text);
console.log('done');
