chrome:

- attivare opzione sviluppatori
- attivare estensione al path ...  es c:/myExt
- settare donwload del browser su cartella estensione ... es c:/myExt ( togliere richieste conferme e varie dai settaggi download )
- al primo test con screenshots runnato confermare l'eventuale popup di accettazione download multipli 

domains:

- aggiungere il dominio dove usare l'estensione in manifest.json ( se assente ) 
- se si tratta di multidomini ( es http e https ) aggiungere casistica elenco url in script.js  ( var hostNamesMatchList )
- riavviare l'estensione dalla pagina di gestione chrome

grunt e node:

- bisogna avere analize.js e gruntFile.js in root estensione
- creare nuovo progetto grunt ( npm )
- scaricare i plugin grunt grunt-contrib-watch e grunt-exec ( npm )
- scaricare i moduli node node-resemble-js e node-mime nomailer
- x nomailer via smtp gmail disattivare controlli da https://www.google.com/settings/security/lesssecureapps
- x nodemailer settare username e password in analize.js
