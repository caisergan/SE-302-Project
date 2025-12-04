1 Introduction

Exam scheduler is going to be a desktop application that will be used to schedule the exams of the students that is designed for the The Student Affairs authority. Users will be able to import the classrooms, courses and students to the system. The courses shall include the student attendance data. Users will also be able to update the imported data and create their schedules on those data. Exam scheduler app will feature a calendar view to display the scheduled exam list to the user in a convenient way. And search through the scheduled exams related to their information. Exam scheduler planned as a standalone application that does not depend any other application or service.

2 User Requirements

The user requirements can be detailed as follows.

[X] Functional Requirement 1: The user shall be able to import data files for courses and classrooms. Rationale: The Student Affairs authority will provide the necessary data via files. In order to avoid manual data entry, the system must allow the import of these files. At least two files; one for course codes with registered students and the other for classrooms with their capacities must be included in the imported data.

[X] Functional Requirement 2: The user shall be able to manage and update the input data. Rationale: Data such as student registrations or classroom availability may change, requiring the user to update the inputs. The user must have the option to change the data in the files and re-import them. This implies the system should handle data creation, editing, and removal via file re-import. The user also must have an option to change them manually one by one giving more option to the user.

[-] Functional Requirement 3: The user shall be able to initiate the schedule generation process. Rationale: After importing or updating the data files, the user must be able to "re-run the program" to generate a new schedule based on the most recent data. (Implemented but uses mock logic)

[-] Functional Requirement 4: The user shall be able to view the generated schedule by classroom. Rationale: The user has to confirm the timetable from multiple perspectives, including how the classroom is utilized. The matching exams for the courses that are allocated to each classroom must be displayed in this view. (View exists but data is mock)

[-] Functional Requirement 5: The user shall be able to view the generated schedule by student. Rationale: This view is essential for checking individual student schedules and verifying constraints. This view must display the complete exam schedule for each student. (View exists but data is mock)

[-] Functional Requirement 6: The user shall be able to view the generated schedule by course. Rationale: The user must be able to confirm the final exam time and location for each course. This view must display the exact assigned time and classroom for each course exam. (View exists but data is mock)

[-] Functional Requirement 7: The user shall be able to view the generated schedule by day. Rationale: This provides a daily overview of all scheduled exams for logistical planning. This view must display all exams occurring in each time slot for any given day. (View exists but data is mock)

[] Functional Requirement 8: The user shall be able to export the scheduled exams to the document. Rationale: Program should support the export functionality. In order to let user export the scheduled exam list into some kind of document format (e.g. csv or excel)

[] Non-functional Requirement 1: The user shall be able to access help menus. Rationale: The user, as the Student Affairs authority, requires in-application documentation or "help menus" to use the software effectively.

3 System Requirements

The system requirements can be detailed as follows.

[X] Functional Requirement 9: The system shall parse and process input data. Rationale: The system must read the imported files and correctly interpret the data for students, courses with registered students, and classrooms with capacities.

[] Functional Requirement 10: The system shall generate a valid exam schedule. Rationale: This is the primary function of the application. The system must assign courses to available time slots and classrooms based on the input data and a defined exam period (e.g. a set number of days and slots per day).

[] Functional Requirement 11: The system shall enforce the "no consecutive exams" student constraint. Rationale: The system must ensure that no two consecutive time slots are assigned for exams for the same student. This is a mandatory, unchangeable constraint to ensure student well-being.

[] Functional Requirement 12: The system shall enforce the "maximum daily exams" student constraint. Rationale: The system must ensure that the number of exams assigned to a student in a single day does not exceed two. This is a mandatory, unchangeable constraint to ensure student well-being.

[] Functional Requirement 13: The system shall report when no solution is found. Rationale: It may be impossible to create a schedule that satisfies all constraints (e.g number of days, slots, students, rooms). If a valid schedule cannot be found, the system shall report to the user that "no solution could be generated". The system must not violate the mandatory constraints.

[] Functional Requirement 14: The system shall be able to save the generated exam schedule to a file system. Rationale: The system should save the previously generated exam schedule to a file system (e.g. SQLite database in order to enhance user experience by eliminating the need for the user to import and generate the same program every time the user opens the application

[X] Non-functional Requirement 2: The system shall be able to run on a Windows system. Rationale: The target platform is Windows; however, the selected programming language could also provide portability to other platforms. The application does not depend on any operating system specific functionality.

[X] Non-functional Requirement 3: The system shall be in English. Rationale: The system shall be in English so that the application can be used and understood internationally.