export const englishIssues:Record<string,{title:string;explanation:string;recommendation:string}>={
 bio:{title:'No profile bio',explanation:'The source returned an empty bio.',recommendation:'Write a short bio that explains your content and its value to followers.'},
 empty:{title:'No public posts according to the source',explanation:'The source returned zero posts. This does not prove any internal account status.',recommendation:'Publish public content if reaching an audience is your goal.'},
 engagement:{title:'Sample engagement is below one percent',explanation:'An estimate from available video views, not a verdict on the entire account.',recommendation:'Try clearer opening hooks, then compare against a comparable future sample.'},
 irregular:{title:'Uneven posting intervals in the sample',explanation:'This estimate uses only the available video publication dates.',recommendation:'Test a sustainable posting schedule and compare actual outcomes.'},
 insufficient:{title:'Insufficient data for complete engagement analysis',explanation:'Some required video metrics are unavailable.',recommendation:'Connect an authorized source providing views, likes, comments, and shares.'},
};
export const englishFactors:Record<string,string>={'وضوح وصف الحساب':'Profile bio','توفر صورة الملف':'Profile image','وجود منشورات عامة':'Public posts','وجود اسم ظاهر':'Display name'};
