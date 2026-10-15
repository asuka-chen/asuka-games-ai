"""Generate original, self-contained SVG equipment art; no remote fonts or images."""
from pathlib import Path
import math

ROOT=Path(__file__).resolve().parent.parent/'star-abyss/assets/icons'
ROOT.mkdir(parents=True,exist_ok=True)
def path(d,fill='none',stroke='var(--c)',width=3):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"/>'
def circle(x,y,r,fill='none',stroke='var(--c)',width=3):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"/>'
def rect(x,y,w,h,fill='url(#metal)',stroke='var(--c)'):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
def rays(n=6,r1=17,r2=31):
 return ''.join(path(f'M {64+math.cos(i*math.tau/n)*r1:.1f} {62+math.sin(i*math.tau/n)*r1:.1f} L {64+math.cos(i*math.tau/n)*r2:.1f} {62+math.sin(i*math.tau/n)*r2:.1f}',width=3) for i in range(n))
def motif(name,n=1):
 if name=='dark-sigil':return motif('hole')+path('M44 37L39 24M85 39L99 27M88 85L99 96M39 83L26 96',stroke='#e092ef')
 if name=='dark-brand':return motif('hole')+path('M64 34L48 68H62L57 94L83 55H66Z','var(--c)','none')
 if name=='dark-crystal':return path('M64 24L90 49L80 89L64 101L44 84L35 49Z','url(#metal)')+path('M64 24V101M35 49L64 60L90 49M44 84L64 60L80 89')+circle(64,60,8,'#180a2d')
 if name=='splitter':return motif('bullet')+path('M64 66L30 40M64 66L97 40M64 53V22',width=3)+circle(30,36,5,'var(--c)')+circle(98,36,5,'var(--c)')+circle(64,20,4,'var(--c)')
 if name=='phase-time':return motif('portal')+path('M28 33H46M20 44H39M18 55H35',width=2)+circle(88,83,16,'#102539')+path('M88 73V84L97 88',stroke='#edfbff',width=2)
 if name=='anchor':return motif('shield')+path('M64 33V91M43 78Q64 105 85 78M43 78V88M85 78V88',stroke='#edfbff',width=4)+circle(64,28,6)
 if name=='crit-energy':return motif('target')+path('M66 43L55 66H68L60 85L79 59H66Z','var(--c)','none')
 if name=='rail-mark':return path('M45 30V94M83 30V94',width=3)+path('M64 25V97',stroke='#e9faff',width=4)+''.join(path(f'M38 {y}H90',stroke='var(--c)',width=2) for y in [52,69,86])+circle(64,34,8,'url(#metal)')
 if name=='bullet':return path('M54 87V47Q64 22 74 47V87Z','url(#metal)')+rect(51,83,26,9)+path('M59 48L64 37L69 48',stroke='#e4fbff',width=2)
 if name=='drill':return motif('bullet')+''.join(path(f'M54 {50+i*8}L74 {58+i*8}',stroke='#e0f3fa',width=2) for i in range(4))
 if name=='magazine':return rect(39,37,50,51)+''.join(rect(44+i*10,43,6,34,fill='#172c3c') for i in range(4))+path('M46 91H84')
 if name=='loader':return circle(64,62,27,fill='url(#metal)')+rays(10,27,34)+circle(64,62,17)+path('M58 47L77 62L58 77Z','var(--c)')
 if name=='shield':return path('M64 29L91 42L87 70L64 93L41 70L37 42Z','url(#metal)')+path('M64 41L79 48L76 65L64 79L52 65L49 48Z','#12283b')+path('M64 45V73M53 58H75',stroke='#d9f5fc',width=2)
 if name=='engine':return ''.join(rect(38+i*19,37+(i%2)*8,14,37,fill='url(#metal)')+path(f'M{40+i*19} 77L{45+i*19} 94L{50+i*19} 77','var(--c)','var(--c)') for i in range(3))
 if name=='magnet':return path('M39 38V65Q39 89 64 89Q89 89 89 65V38H76V65Q76 77 64 77Q52 77 52 65V38Z','url(#metal)')+rect(38,34,15,13)+rect(75,34,15,13)+path('M58 39L64 49L70 39M64 49V60')
 if name=='target':return circle(64,62,28)+circle(64,62,15)+path('M64 26V43M64 81V98M28 62H45M83 62H100')+circle(64,62,5,'#eafaff')
 if name=='battery':return rect(45,35,38,54)+rect(55,28,18,8)+path('M68 44L55 64H66L60 79L76 57H65Z','var(--c)','none')
 if name=='cooler':return rect(41,35,46,53)+''.join(path(f'M46 {42+i*8}H82',stroke='#c8eaf2',width=3) for i in range(5))+path('M31 42Q22 55 31 67M97 52Q106 65 97 79',width=2)
 if name=='scanner':return path('M36 89L49 45H79L92 89Z','url(#metal)')+circle(64,54,18)+path('M64 54L78 42M49 77H79')+path('M36 32Q64 12 92 32M44 38Q64 23 84 38',width=2)
 if name=='box':return path('M37 44L64 31L91 44V84L64 96L37 84Z','url(#metal)')+path('M37 44L64 57L91 44M64 57V96M49 39L77 51')+path('M51 65L60 70M73 66L82 62',stroke='#def4ff',width=2)
 if name=='prism':return path('M64 28L92 82H36Z','url(#metal)')+path('M17 62H54L89 49M65 63L97 66M66 72L97 85',width=3)+path('M64 39L80 74H48Z',stroke='#eaf7ff',width=1)
 if name=='mirror':return path('M31 32H51V82H31ZM77 42H97V92H77Z','url(#metal)')+path('M22 74L42 55L87 78L64 38L108 56',stroke='#e4c6ff',width=3)+path('M34 38L47 49M80 48L93 59',stroke='#dff8ff',width=2)
 if name=='radar':return motif('target')+path('M64 62L88 47M64 62L78 85',width=2)+circle(80,47,4,'var(--c)')+circle(49,75,3,'var(--c)')
 if name=='fission':return circle(64,62,11,'url(#metal)')+''.join(circle(64+math.cos(i*math.tau/3)*29,62+math.sin(i*math.tau/3)*29,9,'url(#metal)')+path(f'M64 62L{64+math.cos(i*math.tau/3)*21:.1f} {62+math.sin(i*math.tau/3)*21:.1f}') for i in range(3))
 if name=='fire':return path('M66 26Q84 46 89 68Q91 91 65 96Q35 92 38 70Q40 50 54 40L52 62Q68 55 66 26Z','url(#metal)')+path('M66 56Q80 82 65 86Q48 84 57 68L60 77Z','var(--c)','none')
 if name=='ice':return rays(6,0,35)+''.join(path(f'M52 40L64 50L76 40',width=2) if i==0 else f'<g transform="rotate({i*60} 64 62)">'+path('M52 40L64 50L76 40',width=2)+'</g>' for i in range(6))+circle(64,62,7,'#e4faff')
 if name=='coil':return path('M46 89V36H82V89Z','url(#metal)')+''.join(path(f'M38 {46+i*10}Q64 {34+i*10} 90 {46+i*10}',width=3) for i in range(4))+path('M67 29L55 57H68L60 77L79 50H66','var(--c)','none')
 if name=='star':return path('M64 25L72 51L99 61L73 71L64 99L55 72L28 62L55 52Z','url(#metal)')+circle(64,62,10,'var(--c)')
 if name=='circuit':return rect(44,42,40,40)+circle(64,62,11)+path('M25 32H42V49M103 32H87V49M25 92H42V75M103 92H87V75M64 23V40M64 84V101')+circle(25,32,4)+circle(103,92,4)
 if name=='portal':return '<ellipse cx="64" cy="62" rx="20" ry="33" fill="#0d1b2b" stroke="var(--c)" stroke-width="4"/>'+path('M27 62H66L55 51M66 62L55 73M79 34L95 44M79 89L95 79',width=3)
 if name=='drone':return path('M64 40L72 55L87 59L82 72L69 68L64 78L59 68L46 72L41 59L56 55Z','url(#metal)')+circle(64,60,5,'var(--c)')+path('M36 40L45 32M83 32L92 40M31 80L40 89M88 89L97 80',width=2)
 if name=='coin':return circle(64,62,30,'url(#metal)')+circle(64,62,22)+path('M64 40L79 62L64 84L49 62Z','var(--c)')
 if name=='heart':return path('M64 40C40 18 21 54 43 75L64 95L85 75C107 54 88 18 64 40Z','url(#metal)')+path('M38 62H52L60 46L70 76L77 62H92',stroke='var(--c)',width=3)
 if name=='twins':return '<g transform="translate(-18 0) scale(.85) translate(12 10)">'+motif('prism')+'</g><g transform="translate(26 0) scale(.85) translate(-12 10)">'+motif('prism')+'</g>'+path('M48 62H80',stroke='#e9f8ff',width=4)
 if name=='orbit':return circle(64,62,24,'#15283a')+'<ellipse cx="64" cy="62" rx="42" ry="15" transform="rotate(-28 64 62)" fill="none" stroke="var(--c)" stroke-width="3"/>'+circle(95,44,6,'var(--c)')+circle(64,62,11,'url(#metal)')
 if name=='fan':return ''.join(path(f'M64 93L{64+(i-(n-1)/2)*12} 31',width=3) for i in range(n))+path('M51 86H77L72 100H56Z','url(#metal)')
 if name=='hole':return circle(64,62,22,'#060b17',width=4)+'<ellipse cx="64" cy="62" rx="42" ry="12" transform="rotate(-25 64 62)" fill="none" stroke="var(--c)" stroke-width="4"/>'+rays(8,31,37)
 if name=='reactor':return circle(64,62,21,'url(#metal)')+rays(8,23,34)+path('M64 40L83 73H45Z','#15283a')+circle(64,62,8,'var(--c)')
 if name=='trinity':return ''.join(circle(64+math.cos(i*math.tau/3-.5)*25,62+math.sin(i*math.tau/3-.5)*25,13,'#173047',c) for i,c in enumerate(['#ffae79','#91e4f7','#ceacff']))+circle(64,62,7,'#eefaff')
 if name=='clock':return circle(64,62,30,'url(#metal)')+circle(64,62,23)+path('M64 43V64L79 73',stroke='#e2fbff')+path('M32 26L43 35M85 35L96 26')
 if name=='steam':return motif('ice')+'<g transform="translate(27 16) scale(.6)">'+motif('fire')+'</g>'+path('M32 82Q24 69 32 57M97 67Q105 54 97 42',width=2)
 if name=='blade':return path('M59 29L72 22L77 69L64 81L54 66Z','url(#metal)')+path('M44 73L83 67M59 77L62 100L71 97L68 75',width=4)+path('M66 30L70 65',stroke='#ecfbff',width=2)
 if name=='branches':return path('M64 97V61L34 35M64 61L94 35M64 61V25',width=5)+circle(34,35,9,'url(#metal)')+circle(64,25,9,'url(#metal)')+circle(94,35,9,'url(#metal)')+rect(51,85,26,12)
 if name=='echo':return ''.join(f'<g opacity="{.25+i*.3}" transform="translate({i*13-18} {i*8-13})">'+path('M54 43L79 62L54 81Z','url(#metal)')+'</g>' for i in range(3))
 if name=='crown':return path('M35 44L50 60L64 30L78 60L94 41L85 86H43Z','url(#metal)')+path('M45 79H83M67 43L61 61L71 64L63 86',stroke='var(--c)',width=3)
 if name=='chain':return '<g transform="rotate(-35 64 62)">'+rect(36,47,34,24)+rect(60,53,34,24)+'</g>'+path('M58 44L65 60L57 73L66 81',stroke='#e1f8ff',width=3)
 if name=='triple':return ''.join(rect(42+i*15,31,12,51)+circle(48+i*15,84,5,'var(--c)') for i in range(3))+rect(37,89,54,10)
 if name=='ricochet':return path('M28 84L48 40L82 81L101 30',width=4)+''.join(circle(x,y,7,'url(#metal)') for x,y in [(28,84),(48,40),(82,81),(101,30)])
 if name=='siege':return path('M45 87L55 40L64 26L74 40L84 87Z','url(#metal)')+path('M48 68H80M64 41V65')+rays(8,34,40)
 if name=='rails':return ''.join(path(f'M{42+i*22} 93V32M{36+i*22} 45L{42+i*22} 30L{48+i*22} 45',width=3) for i in range(3))+rect(35,88,58,9)
 if name=='missiles':return ''.join(f'<g transform="translate({i*21-31} {abs(i-1.5)*10-9}) scale(.6) translate(37 20)">'+motif('bullet')+'</g>' for i in range(5 if n>=5 else 2))+path('M41 97L64 85L87 97',width=2)
 if name=='hive':return path('M64 29L99 51L87 86L64 98L41 86L29 51Z','url(#metal)')+''.join(path(f'M{x} {y-8}L{x+8} {y-4}V{y+5}L{x} {y+9}L{x-8} {y+5}V{y-4}Z','#142b3e') for x,y in [(64,49),(49,63),(79,63),(64,77)])
 return motif('reactor')

relics={
 'C01':('bullet',1),'C02':('loader',1),'C03':('shield',1),'C04':('engine',1),'C05':('magnet',1),'C06':('target',1),'C07':('magazine',1),'C08':('battery',1),'C09':('drill',1),'C10':('cooler',1),'C11':('scanner',1),'C12':('splitter',1),
 'R01':('prism',1),'R02':('battery',2),'R03':('radar',1),'R04':('fission',1),'R05':('fire',1),'R06':('ice',1),'R07':('coil',1),'R08':('star',1),'R09':('circuit',1),'R10':('portal',1),'R11':('drone',1),'R12':('coin',1),
 'E01':('heart',1),'E02':('twins',1),'E03':('mirror',1),'E04':('orbit',1),'E05':('fan',5),'E06':('hole',1),'E07':('reactor',1),'E08':('trinity',1),'E09':('heart',2),'E10':('clock',1),'E11':('coil',2),'E12':('steam',1),
 'L01':('blade',1),'L02':('branches',1),'L03':('hole',2),'L04':('echo',1),'L05':('trinity',2),'L06':('shield',2),
 'X01':('heart',3),'X02':('branches',2),'X03':('crown',1),'X04':('blade',2),'X05':('reactor',2),'X06':('chain',1)}
relics.update({'R13':('phase-time',1),'E13':('anchor',1),'R14':('dark-sigil',1),'E14':('dark-brand',1),'E15':('dark-crystal',1)})
synergies=['prism','twins','mirror','battery','fan','cooler','fire','ice','drone','steam','trinity','hole','echo','shield','heart','blade','triple','ricochet','magazine','siege','rails','hole','radar','hive']
evolutions=['blade','mirror','twins','orbit','drone','steam','hole','crown','triple','ricochet','fan','siege','rails','hole','missiles','hive']
items={**relics,**{f'B{i+1:02}':(m,9 if i==4 else 5) for i,m in enumerate(synergies)},**{f'U{i+1:02}':(m,9 if i==10 else 5) for i,m in enumerate(evolutions)}}
items.update({f'weapon-{id}':(m,n) for id,m,n in [('beam','blade',1),('pulse','triple',1),('shotgun','fan',5),('rail','rails',1),('swarm','missiles',1)]})
items.update({f'upgrade-{id}':(m,1) for id,m in [('attack','bullet'),('rate','loader'),('health','shield'),('shield','shield'),('speed','engine'),('crit','target'),('crit-conversion','crit-energy'),('duration','battery'),('width','fan'),('projectile','missiles'),('element','trinity'),('rail-mark','rail-mark')]})
items.update({f'element-{id}':(m,1) for id,m in [('fire','fire'),('ice','ice'),('lightning','coil'),('poison','fission'),('light','star'),('dark','hole')]})
items.update({'upgrade-coins':('coin',1),'upgrade-repair':('heart',1),'upgrade-logistics':('box',1)})
pairs=[('fire','ice'),('fire','coil'),('fire','fission'),('fire','star'),('fire','hole'),('ice','coil'),('ice','fission'),('ice','star'),('ice','hole'),('coil','fission'),('coil','star'),('coil','hole'),('fission','star'),('fission','hole'),('star','hole')]
items.update({f'Q{i+1:02}':('pair',i) for i in range(15)})
items.update({'challenge-no-dash':('portal',3),'challenge-no-shield':('shield',3),'challenge-weak-weapon':('bullet',3)})
colors={'C':'#89d4e9','R':'#7de8dd','E':'#c4a5ff','L':'#ffd599','X':'#ff879e','B':'#9ee9e6','U':'#ffd19b'}
for index,(id,(theme,n)) in enumerate(items.items()):
 color=colors.get(id[0],'#98dcec');body=motif(theme,n)
 if theme=='pair':body=''.join('<g transform="translate('+str(x)+' 13) scale(.68)">'+motif(m)+'</g>' for x,m in zip([-7,44],pairs[n]))+path('M53 66L64 53L75 66L64 79Z','var(--c)')
 if id.startswith('challenge-'):body+=path('M29 94L99 30',stroke='#ff819c',width=6)
 if id=='U14':body=motif('hole')+'<g transform="translate(18 18) scale(.72)">'+motif('rails')+'</g>'
 if id=='X01':body+=path('M35 43L24 23L49 37M79 37L104 23L93 43',stroke=color,width=3)
 # Item-specific circuitry and orbit details distinguish related equipment.
 detail=path(f'M19 {40+index%4*10}H27M101 {40+index%5*8}H109',stroke=color,width=2)+''.join(circle(24+i*8,104,1.5,color,'none') for i in range(2+index%5))
 if id.startswith('B'):body=body+circle(64,62,43,stroke=color+'66',width=1)+path('M13 62H23M105 62H115',width=2)
 if id.startswith('U'):body=body+rays(12,43,48)+circle(64,62,49,stroke=color+'55',width=1)
 if theme=='battery' and n==2:body+=path('M31 49L24 65H34L29 78',stroke='#ff9dba')
 if theme=='heart' and n>1:body+=path('M65 36L59 59L72 65L58 86',stroke='#ffdbe4',width=3)
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" style="--c:{color}"><defs><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8198ad"/><stop offset=".35" stop-color="#263d52"/><stop offset=".75" stop-color="#182c40"/><stop offset="1" stop-color="#58788e"/></linearGradient><radialGradient id="bg"><stop stop-color="{color}" stop-opacity=".16"/><stop offset="1" stop-color="#091421" stop-opacity="0"/></radialGradient></defs><circle cx="64" cy="64" r="62" fill="url(#bg)"/><path d="M34 9H94L119 34V94L94 119H34L9 94V34Z" fill="#0e1e2e" fill-opacity=".6" stroke="{color}" stroke-opacity=".35"/>{detail}<g>{body}</g></svg>'''
 (ROOT/(id+'.svg')).write_text(svg)
print(f'Generated {len(items)} original equipment icons')
